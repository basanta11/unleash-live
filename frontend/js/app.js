/**
 * Main Application - Initializes the Point Cloud Annotator application
 */

let pointCloudViewer;
let annotationManager;

/**
 * Initialize the application
 */
function initApp() {
    // Initialize point cloud viewer
    pointCloudViewer = new PointCloudViewer('potree-render-area');
    
    // Wait for viewer to be ready, then initialize annotation manager
    setTimeout(() => {
        const viewer = pointCloudViewer.getViewer();
        const scene = pointCloudViewer.getScene();
        
        // Initialize annotation manager with viewer reference
        annotationManager = new AnnotationManager(viewer, scene);
        
        // Listen for point cloud clicks
        document.addEventListener('pointCloudClick', (event) => {
            const coordinates = event.detail;
            annotationManager.showAnnotationForm(coordinates);
        });
        
        // Auto-load point cloud on page load
        loadPointCloud();
    }, 100);

    // Setup load point cloud button (for reloading)
    const loadBtn = document.getElementById('loadPointCloud');
    if (loadBtn) {
        loadBtn.textContent = 'Reload Point Cloud';
        loadBtn.addEventListener('click', () => {
            loadPointCloud();
        });
    }
}

/**
 * Load the lion_takanawa point cloud
 */
function loadPointCloud() {
    const loadBtn = document.getElementById('loadPointCloud');
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.textContent = 'Loading...';
    }

    // Load lion_takanawa point cloud from Potree pointclouds directory
    const pointCloudPath = 'lib/potree/pointclouds/lion_takanawa/cloud.js';
    
    pointCloudViewer.loadPointCloud(pointCloudPath)
        .then(() => {
            if (loadBtn) {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Reload Point Cloud';
            }
            // Show success message if annotation manager is available
            if (annotationManager) {
                annotationManager.showToast('success', 'Point Cloud Loaded', 'The point cloud has been loaded successfully');
            }
        })
        .catch((error) => {
            console.error('Failed to load point cloud:', error);
            if (loadBtn) {
                loadBtn.disabled = false;
                loadBtn.textContent = 'Reload Point Cloud';
            }
            // Show error message if annotation manager is available
            if (annotationManager) {
                annotationManager.showToast('error', 'Load Failed', 'Failed to load point cloud. Please check the console for details.');
            } else {
                alert('Failed to load point cloud. Please check the console for details.');
            }
        });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
