/**
 * Point Cloud Viewer - Handles Potree viewer initialization and point cloud loading
 */

class PointCloudViewer {
    constructor(containerId) {
        this.containerId = containerId;
        this.viewer = null;
        this.scene = null;
        this.pointCloud = null;
        
        this.initializeViewer();
    }

    /**
     * Initialize the Potree viewer
     */
    initializeViewer() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with id "${this.containerId}" not found`);
            return;
        }

        if (typeof Potree === 'undefined') {
            console.error('Potree is not loaded. Please ensure Potree library is available.');
            return;
        }

        this.initializePotreeViewer(container);
    }

    /**
     * Initialize Potree viewer
     */
    initializePotreeViewer(container) {
        try {
            // Initialize Potree viewer
            this.viewer = new Potree.Viewer(container);
            
            this.viewer.setEDLEnabled(true);
            this.viewer.setFOV(60);
            this.viewer.setPointBudget(1_000_000);
            this.viewer.loadSettingsFromURL();
            this.viewer.setBackground("skybox");
            
            // Load GUI
            this.viewer.loadGUI(() => {
                this.viewer.setLanguage('en');
            });
            
            // Get the scene
            this.scene = this.viewer.scene;
            
            // Setup click handler for annotations
            this.setupPotreeClickHandler();
            
            console.log('Potree viewer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Potree viewer:', error);
            throw error;
        }
    }

    /**
     * Setup click handler for Potree viewer
     */
    setupPotreeClickHandler() {
        if (!this.viewer) return;

        // Listen for clicks on the render area
        const renderArea = document.getElementById(this.containerId);
        
        renderArea.addEventListener('click', (event) => {
            // Get mouse position in normalized device coordinates
            const rect = renderArea.getBoundingClientRect();
            const mouse = new THREE.Vector2();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // Get camera and calculate ray
            const camera = this.viewer.scene.getActiveCamera();
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, camera);

            // Calculate a 3D point along the ray
            // Use the distance to the scene's pivot point (center of view) as reference
            let distance = 5; // Default distance
            
            // If we have point clouds, use the distance to the first point cloud's bounding box center
            if (this.viewer.scene.pointclouds.length > 0) {
                const pointcloud = this.viewer.scene.pointclouds[0];
                if (pointcloud.boundingBox) {
                    const center = pointcloud.boundingBox.getCenter(new THREE.Vector3());
                    const cameraPos = camera.position;
                    distance = cameraPos.distanceTo(center);
                }
            } else {
                // Use scene view pivot if available
                const pivot = this.viewer.scene.view.getPivot();
                if (pivot) {
                    const cameraPos = camera.position;
                    distance = cameraPos.distanceTo(pivot);
                }
            }

            // Calculate world position along the ray
            const worldPosition = new THREE.Vector3();
            raycaster.ray.at(distance, worldPosition);
            
            // Dispatch click event with 3D coordinates
            const clickEvent = new CustomEvent('pointCloudClick', {
                detail: {
                    x: worldPosition.x,
                    y: worldPosition.y,
                    z: worldPosition.z
                }
            });
            document.dispatchEvent(clickEvent);
        });
    }

    /**
     * Load a point cloud file using Potree
     * @param {string} url - URL to the Potree cloud.js file
     */
    async loadPointCloud(url) {
        if (!url) {
            throw new Error('Point cloud URL is required');
        }

        return this.loadPotreePointCloud(url);
    }

    /**
     * Load point cloud using Potree
     * @param {string} url - URL to cloud.js file (Potree format)
     */
    loadPotreePointCloud(url) {
        return new Promise((resolve, reject) => {
            try {
                Potree.loadPointCloud(url, "pointcloud", (e) => {
                    this.viewer.scene.addPointCloud(e.pointcloud);
                    this.pointCloud = e.pointcloud;
                    
                    let material = e.pointcloud.material;
                    material.size = 1;
                    material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
                    
                    this.viewer.fitToScreen();
                    
                    console.log('Point cloud loaded successfully');
                    resolve(e.pointcloud);
                });
            } catch (error) {
                console.error('Failed to load Potree point cloud:', error);
                reject(error);
            }
        });
    }

    /**
     * Get the viewer instance
     */
    getViewer() {
        return this.viewer;
    }

    /**
     * Get the scene
     */
    getScene() {
        return this.scene;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PointCloudViewer;
}
