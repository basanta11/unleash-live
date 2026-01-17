const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.ANNOTATIONS_TABLE;

/**
 * Lambda handler to get all annotations
 */
exports.handler = async (event) => {
    console.log('getAnnotations event:', JSON.stringify(event, null, 2));

    try {
        // Scan the table to get all annotations
        const params = {
            TableName: TABLE_NAME
        };

        const result = await dynamodb.scan(params).promise();

        // Transform DynamoDB items to annotation format
        const annotations = result.Items.map(item => ({
            annotationId: item.annotationId,
            x: parseFloat(item.x),
            y: parseFloat(item.y),
            z: parseFloat(item.z),
            text: item.text,
            createdAt: item.createdAt
        }));

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
                annotations: annotations
            })
        };
    } catch (error) {
        console.error('Error getting annotations:', error);
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
                error: 'Failed to retrieve annotations',
                message: error.message
            })
        };
    }
};
