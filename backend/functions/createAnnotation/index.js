const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const crypto = require('crypto');

const TABLE_NAME = process.env.ANNOTATIONS_TABLE;

/**
 * Lambda handler to create a new annotation
 */
exports.handler = async (event) => {
    console.log('createAnnotation event:', JSON.stringify(event, null, 2));

    try {
        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (e) {
            body = event.body;
        }

        // Validate required fields
        if (!body.x || !body.y || !body.z) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: x, y, z coordinates are required'
                })
            };
        }

        // Validate text field
        if (!body.text || typeof body.text !== 'string') {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Text field is required and must be a string'
                })
            };
        }

        // Validate text length (256 bytes max)
        const textBytes = Buffer.byteLength(body.text, 'utf8');
        if (textBytes > 256) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Annotation text exceeds 256 bytes limit'
                })
            };
        }

        // Create annotation object
        const annotationId = crypto.randomUUID();
        const annotation = {
            annotationId: annotationId,
            x: parseFloat(body.x),
            y: parseFloat(body.y),
            z: parseFloat(body.z),
            text: body.text.trim(),
            createdAt: new Date().toISOString()
        };

        // Save to DynamoDB
        const params = {
            TableName: TABLE_NAME,
            Item: annotation
        };

        await dynamodb.put(params).promise();

        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                annotation: annotation
            })
        };
    } catch (error) {
        console.error('Error creating annotation:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to create annotation',
                message: error.message
            })
        };
    }
};
