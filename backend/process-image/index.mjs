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
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
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

    const detections =
      rekognitionResponse.TextDetections || [];

    console.log(
      JSON.stringify(detections, null, 2)
    );

    // Relaxed regex for South African plates
    const plateLine = detections.find(
      (text) =>
        text.Type === "LINE" &&
        /^[A-Z]{2,3}\s?\d{3}\s?[A-Z]{0,2}$/.test(
          text.DetectedText.trim()
        )
    );

    const plateNumber = plateLine
      ? plateLine.DetectedText.trim()
      : "Plate not found";

    console.log("Plate:", plateNumber);

    console.log("Invoking save-record Lambda...");

    const payload = {
      plateNumber,
      operation,
    };

    const response = await lambda.send(
      new InvokeCommand({
        FunctionName: SAVE_RECORD_FUNCTION,
        InvocationType: "RequestResponse",
        Payload: Buffer.from(JSON.stringify(payload)),
      })
    );

    const lambda2Response = Buffer.from(
      response.Payload
    ).toString();

    console.log(
      "Lambda 2 Response:",
      lambda2Response
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
      },
      body: JSON.stringify({
        success: true,
        plateNumber,
        operation,
      }),
    };
  } catch (error) {
    console.error("ERROR:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
      },
      body: JSON.stringify({
        message: error.message,
      }),
    };
  }
};