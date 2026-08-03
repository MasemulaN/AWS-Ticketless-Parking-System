import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import {
  RekognitionClient,
  DetectTextCommand,
} from "@aws-sdk/client-rekognition";
import {
  LambdaClient,
  InvokeCommand,
} from "@aws-sdk/client-lambda";

// ---------------- CONFIG ----------------

const S3_REGION = "eu-west-1";
const BUCKET_NAME = "nm-autopark-vision-ai";

const LAMBDA_REGION = "af-south-1";
const SAVE_RECORD_FUNCTION = "nm-autopark-manage-session";

// ---------------- AWS CLIENTS ----------------

const s3 = new S3Client({
  region: S3_REGION,
});

const rekognition = new RekognitionClient({
  region: S3_REGION,
});

const lambda = new LambdaClient({
  region: LAMBDA_REGION,
});

// ---------------- PLATE EXTRACTION ----------------

function extractPlate(detections) {
  // Step 1: Try LINE results first (after cleaning noise characters)
  const lines = detections.filter(
    (item) => item.Type === "LINE" && item.Confidence > 80
  );

  for (const line of lines) {
    const cleaned = line.DetectedText
      .replace(/[^A-Z0-9 ]/g, "")   // Remove dashes and special chars
      .replace(/\s+/g, " ")          // Collapse multiple spaces
      .trim();

    // Match South African plate format: ABC 123 MP
    if (/^[A-Z]{2,3} \d{3} [A-Z]{2}$/.test(cleaned)) {
      return cleaned;
    }
  }

  // Step 2: Fallback - reconstruct plate from high-confidence WORD detections
  const words = detections
    .filter((item) => item.Type === "WORD" && item.Confidence > 85)
    .map((item) => item.DetectedText)
    .filter((text) => /^[A-Z0-9]+$/.test(text)); // Only alphanumeric words

  // Try all combinations of 3 consecutive words
  for (let i = 0; i <= words.length - 3; i++) {
    const candidate = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (/^[A-Z]{2,3} \d{3} [A-Z]{2}$/.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

// ---------------- CORS HEADERS ----------------

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

// ---------------- HANDLER ----------------

export const handler = async (event) => {
  try {
    console.log("===== EVENT RECEIVED =====");

    let body;

    if (event.body) {
      body =
        typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body;
    } else {
      body = event;
    }

    const { image, operation } = body;

    if (!image || !operation) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          message: "Image and operation are required.",
        }),
      };
    }

    console.log("Image received");

    const imageBuffer = Buffer.from(image, "base64");
    const objectKey = `uploads/${Date.now()}.jpg`;

    console.log("Uploading to S3...");

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: imageBuffer,
        ContentType: "image/jpeg",
      })
    );

    console.log("Image uploaded");
    console.log("Running Rekognition...");

    const rekognitionResponse = await rekognition.send(
      new DetectTextCommand({
        Image: {
          S3Object: {
            Bucket: BUCKET_NAME,
            Name: objectKey,
          },
        },
      })
    );

    console.log("Rekognition complete");

    const detections = rekognitionResponse.TextDetections || [];

    console.log(JSON.stringify(detections, null, 2));

    // Extract plate using improved logic
    const plate = extractPlate(detections);
    const plateNumber = plate ?? "Plate not found";

    console.log("Plate:", plateNumber);

    // ✅ FIX 1: Use plate_number (snake_case) to match Lambda 2 expectation
    const payload = {
      plate_number: plateNumber,
      operation,
    };

    console.log("Invoking nm-autopark-manage-session Lambda...");

    const lambdaResponse = await lambda.send(
      new InvokeCommand({
        FunctionName: SAVE_RECORD_FUNCTION,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(JSON.stringify(payload)),
      })
    );

    // ✅ FIX 2: Parse Lambda 2 response properly
    const lambda2Result = JSON.parse(
      Buffer.from(lambdaResponse.Payload).toString()
    );

    console.log("Lambda 2 Result:", lambda2Result);

    // ✅ FIX 3: Parse the body from Lambda 2
    const lambda2Body = JSON.parse(lambda2Result.body);

    console.log("Lambda 2 Body:", lambda2Body);

    // ✅ FIX 4: Forward Lambda 2 response to frontend with plate and operation
    return {
      statusCode: lambda2Result.statusCode,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        ...lambda2Body,              // Spreads message, entry_time, exit_time, duration_minutes, fee_rands
        plate_number: plateNumber,   // Always include detected plate
        operation,                   // Always include operation
      }),
    };

  } catch (error) {
    console.error("ERROR:", error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
};
