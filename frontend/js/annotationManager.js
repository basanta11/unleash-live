/**
 * Annotation Manager - Handles annotation state, UI, and rendering
 */

class AnnotationManager {
    constructor(viewer, potreeViewer) {
        this.viewer = viewer;
        this.scene = potreeViewer; // Potree scene
        this.annotations = [];
        this.pendingAnnotation = null; // Stores coordinates when user clicks on point cloud
        this.selectedAnnotationId = null;
        this.potreeAnnotations = new Map(); // Store Potree annotation objects
        
        this.initializeUI();
        this.loadAnnotations();
    }

    initializeUI() {
        // Annotation form elements
        this.annotationForm = document.getElementById('annotation-form');
        this.annotationText = document.getElementById('annotation-text');
        this.charCount = document.getElementById('char-count');
        this.saveBtn = document.getElementById('save-annotation');
        this.cancelBtn = document.getElementById('cancel-annotation');
        this.annotationsList = document.getElementById('annotations-list');
        this.clearBtn = document.getElementById('clearAnnotations');
        this.clickedCoordinatesDisplay = document.getElementById('clicked-coordinates');

        // Character count update
        this.annotationText.addEventListener('input', () => {
            const text = this.annotationText.value;
            const byteCount = new TextEncoder().encode(text).length;
            this.charCount.textContent = byteCount;
            
            // Update styling based on byte count
            this.charCount.classList.remove('warning', 'error');
            if (byteCount > 256) {
                this.charCount.classList.add('error');
            } else if (byteCount > 200) {
                this.charCount.classList.add('warning');
            }
        });

        // Form actions
        this.saveBtn.addEventListener('click', () => this.saveAnnotation());
        this.cancelBtn.addEventListener('click', () => this.cancelAnnotation());
        this.clearBtn.addEventListener('click', () => this.clearAllAnnotations());

        // Close form on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.annotationForm.style.display !== 'none') {
                this.cancelAnnotation();
            }
        });
    }

    /**
     * Load annotations from the backend
     */
    async loadAnnotations() {
        try {
            this.annotations = await getAnnotations();
            this.renderAnnotations();
            this.renderMarkers();
        } catch (error) {
            console.error('Failed to load annotations:', error);
            this.showError('Failed to load annotations. Please check your API endpoint configuration.');
        }
    }

    /**
     * Show annotation form for a pending annotation
     * @param {Object} coordinates - {x, y, z} coordinates
     */
    showAnnotationForm(coordinates) {
        this.pendingAnnotation = coordinates;
        this.annotationText.value = '';
        this.charCount.textContent = '0';
        
        // Display clicked coordinates
        if (this.clickedCoordinatesDisplay) {
            const x = Number(coordinates.x).toFixed(2);
            const y = Number(coordinates.y).toFixed(2);
            const z = Number(coordinates.z).toFixed(2);
            this.clickedCoordinatesDisplay.innerHTML = `
                <div class="clicked-coords-label">Clicked Coordinates:</div>
                <div class="clicked-coords-values">
                    <span><strong>X:</strong> ${x}</span>
                    <span><strong>Y:</strong> ${y}</span>
                    <span><strong>Z:</strong> ${z}</span>
                </div>
            `;
        }
        
        this.annotationForm.style.display = 'block';
        this.annotationText.focus();
    }

    /**
     * Save the annotation
     */
    async saveAnnotation() {
        if (!this.pendingAnnotation) return;

        const text = this.annotationText.value.trim();
        if (!text) {
            this.showToast('error', 'Validation Error', 'Please enter annotation text');
            return;
        }

        // Check byte length
        const byteCount = new TextEncoder().encode(text).length;
        if (byteCount > 256) {
            this.showToast('error', 'Validation Error', 'Annotation text exceeds 256 bytes limit');
            return;
        }

        try {
            const annotation = await createAnnotation({
                x: this.pendingAnnotation.x,
                y: this.pendingAnnotation.y,
                z: this.pendingAnnotation.z,
                text: text,
            });

            this.annotations.push(annotation);
            this.renderAnnotations();
            this.renderMarkers();
            this.cancelAnnotation();
            this.showToast('success', 'Annotation Created', 'Your annotation has been saved successfully');
        } catch (error) {
            console.error('Failed to save annotation:', error);
            this.showToast('error', 'Save Failed', 'Failed to save annotation. Please try again.');
        }
    }

    /**
     * Cancel annotation creation
     */
    cancelAnnotation() {
        this.pendingAnnotation = null;
        this.annotationForm.style.display = 'none';
        this.annotationText.value = '';
        if (this.clickedCoordinatesDisplay) {
            this.clickedCoordinatesDisplay.innerHTML = '';
        }
    }

    /**
     * Delete an annotation
     * @param {string} annotationId - ID of the annotation to delete
     */
    async deleteAnnotation(annotationId) {
        if (!confirm('Are you sure you want to delete this annotation?')) {
            return;
        }

        try {
            await deleteAnnotation(annotationId);
            
            // Remove Potree annotation if it exists
            if (this.potreeAnnotations.has(annotationId)) {
                const potreeAnn = this.potreeAnnotations.get(annotationId);
                if (this.viewer && this.viewer.scene && this.viewer.scene.annotations) {
                    this.viewer.scene.annotations.remove(potreeAnn);
                }
                this.potreeAnnotations.delete(annotationId);
            }
            
            this.annotations = this.annotations.filter(a => a.annotationId !== annotationId);
            this.renderAnnotations();
            this.renderMarkers();
            
            if (this.selectedAnnotationId === annotationId) {
                this.selectedAnnotationId = null;
            }
            
            this.showToast('success', 'Annotation Deleted', 'The annotation has been removed successfully');
        } catch (error) {
            console.error('Failed to delete annotation:', error);
            this.showToast('error', 'Delete Failed', 'Failed to delete annotation. Please try again.');
        }
    }

    /**
     * Clear all annotations
     */
    async clearAllAnnotations() {
        if (!confirm('Are you sure you want to delete all annotations?')) {
            return;
        }

        try {
            // Delete all annotations one by one
            const deletePromises = this.annotations.map(ann => deleteAnnotation(ann.annotationId));
            await Promise.all(deletePromises);
            
            // Clear Potree annotations
            this.potreeAnnotations.forEach((potreeAnn, annotationId) => {
                if (this.viewer && this.viewer.scene && this.viewer.scene.annotations) {
                    this.viewer.scene.annotations.remove(potreeAnn);
                }
            });
            this.potreeAnnotations.clear();
            
            this.annotations = [];
            this.renderAnnotations();
            this.renderMarkers();
            this.showToast('success', 'All Annotations Cleared', 'All annotations have been removed successfully');
        } catch (error) {
            console.error('Failed to clear annotations:', error);
            this.showToast('error', 'Clear Failed', 'Failed to clear annotations. Please try again.');
        }
    }

    /**
     * Render annotation markers in the 3D scene using Potree annotations
     */
    renderMarkers() {
        // Clear existing Potree annotations
        if (this.viewer && this.viewer.scene && this.viewer.scene.annotations) {
            this.potreeAnnotations.forEach((potreeAnn, annotationId) => {
                this.viewer.scene.annotations.remove(potreeAnn);
            });
            this.potreeAnnotations.clear();
        }

        // Add markers for each annotation
        this.annotations.forEach(annotation => {
            this.addMarker(annotation);
        });
    }

    /**
     * Add a visual marker for an annotation using Potree.Annotation
     * @param {Object} annotation - Annotation object
     */
    addMarker(annotation) {
        if (!this.viewer || !this.viewer.scene || !this.viewer.scene.annotations) {
            console.warn('Potree scene annotations not available');
            return;
        }

        // Use Potree.Annotation
        const potreeAnnotation = new Potree.Annotation({
            position: [annotation.x, annotation.y, annotation.z],
            title: annotation.text.substring(0, 50) + (annotation.text.length > 50 ? '...' : ''),
            description: annotation.text
        });
        
        // Store reference
        this.potreeAnnotations.set(annotation.annotationId, potreeAnnotation);
        
        // Add to scene
        this.viewer.scene.annotations.add(potreeAnnotation);
    }

    /**
     * Render the annotations list in the sidebar
     */
    renderAnnotations() {
        if (this.annotations.length === 0) {
            this.annotationsList.innerHTML = `
                <div class="empty-state">
                    <p>No annotations yet</p>
                    <p style="font-size: 0.85rem; margin-top: 0.5rem;">Click on the point cloud to add an annotation</p>
                </div>
            `;
            return;
        }

        this.annotationsList.innerHTML = this.annotations
            .map(annotation => this.renderAnnotationItem(annotation))
            .join('');

        // Add event listeners to annotation items
        this.annotations.forEach(annotation => {
            const item = document.querySelector(`[data-annotation-id="${annotation.annotationId}"]`);
            if (item) {
                const deleteBtn = item.querySelector('.annotation-delete-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteAnnotation(annotation.annotationId);
                    });
                }

                item.addEventListener('click', () => {
                    this.selectAnnotation(annotation.annotationId);
                });
            }
        });
    }

    /**
     * Render a single annotation item
     * @param {Object} annotation - Annotation object
     * @returns {string} HTML string
     */
    renderAnnotationItem(annotation) {
        const isSelected = this.selectedAnnotationId === annotation.annotationId;
      
        const x = Number(annotation.x).toFixed(2);
        const y = Number(annotation.y).toFixed(2);
        const z = Number(annotation.z).toFixed(2);
      
        return `
          <div class="annotation-card ${isSelected ? "selected" : ""}" data-annotation-id="${annotation.annotationId}">
            <div class="annotation-card-header">
              <h3 class="annotation-card-title">${this.escapeHtml(annotation.text)}</h3>
              <button class="annotation-delete-btn" type="button" title="Delete annotation" aria-label="Delete annotation">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="annotation-card-coords">
              <div class="coord-item">
                <span class="coord-label">X</span>
                <span class="coord-value">${x}</span>
              </div>
              <div class="coord-item">
                <span class="coord-label">Y</span>
                <span class="coord-value">${y}</span>
              </div>
              <div class="coord-item">
                <span class="coord-label">Z</span>
                <span class="coord-value">${z}</span>
              </div>
            </div>
          </div>
        `;
    }
      

    /**
     * Select an annotation (highlight it)
     * @param {string} annotationId - ID of the annotation
     */
    selectAnnotation(annotationId) {
        this.selectedAnnotationId = annotationId;
        this.renderAnnotations();
        
            // Optionally, focus camera on annotation
            const annotation = this.annotations.find(a => a.annotationId === annotationId);
            if (annotation && this.viewer && this.viewer.scene) {
                // Focus on annotation position
                const position = new THREE.Vector3(annotation.x, annotation.y, annotation.z);
                // You can add camera animation here if needed
            }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showToast('error', 'Error', message);
    }

    /**
     * Show toast notification
     * @param {string} type - 'success', 'error', or 'info'
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     */
    showToast(type, title, message) {
        const container = document.getElementById('toast-container');
        if (!container) {
            // Fallback to alert if container doesn't exist
            alert(`${title}: ${message}`);
            return;
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(title)}</div>
                <div class="toast-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()" title="Close" aria-label="Close">×</button>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.add('slide-out');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        }, 5000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnnotationManager;
}
