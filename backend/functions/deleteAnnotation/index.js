const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.ANNOTATIONS_TABLE;

/**
 * Lambda handler to delete an annotation
 */
exports.handler = async (event) => {
    console.log('deleteAnnotation event:', JSON.stringify(event, null, 2));

    try {
        // Get annotation ID from path parameters
        const annotationId = event.pathParameters?.id;

        if (!annotationId) {
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
                    error: 'Annotation ID is required'
                })
            };
        }

        // Delete from DynamoDB
        const params = {
            TableName: TABLE_NAME,
            Key: {
                annotationId: annotationId
            }
        };

        const result = await dynamodb.delete(params).promise();

        // Check if item existed
        // Note: DynamoDB delete doesn't return the item, so we can't check if it existed
        // We'll assume success if no error was thrown

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'Annotation deleted successfully'
            })
        };
    } catch (error) {
        console.error('Error deleting annotation:', error);
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
                error: 'Failed to delete annotation',
                message: error.message
            })
        };
    }
};
