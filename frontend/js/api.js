/**
 * API Service for communicating with the backend API Gateway
 * Update the API_BASE_URL with your deployed API Gateway endpoint
 */

// API Gateway endpoint URL
// Base URL: https://mn5jax6h23.execute-api.us-east-1.amazonaws.com/dev
const API_BASE_URL = 'https://mn5jax6h23.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Get all annotations from the backend
 * @returns {Promise<Array>} Array of annotation objects
 */
async function getAnnotations() {
    try {
        const response = await fetch(`${API_BASE_URL}/annotations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch annotations: ${response.statusText}`);
        }

        const data = await response.json();
        return data.annotations || [];
    } catch (error) {
        console.error('Error fetching annotations:', error);
        throw error;
    }
}

/**
 * Create a new annotation
 * @param {Object} annotation - Annotation object with x, y, z, and text
 * @returns {Promise<Object>} Created annotation object
 */
async function createAnnotation(annotation) {
    try {
        // Validate text length (256 bytes max)
        const textBytes = new TextEncoder().encode(annotation.text).length;
        if (textBytes > 256) {
            throw new Error('Annotation text exceeds 256 bytes limit');
        }

        const response = await fetch(`${API_BASE_URL}/annotations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                x: annotation.x,
                y: annotation.y,
                z: annotation.z,
                text: annotation.text,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create annotation: ${response.statusText}`);
        }

        const data = await response.json();
        return data.annotation;
    } catch (error) {
        console.error('Error creating annotation:', error);
        throw error;
    }
}

/**
 * Delete an annotation by ID
 * @param {string} annotationId - ID of the annotation to delete
 * @returns {Promise<void>}
 */
async function deleteAnnotation(annotationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/annotations/${annotationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to delete annotation: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting annotation:', error);
        throw error;
    }
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getAnnotations, createAnnotation, deleteAnnotation };
}
