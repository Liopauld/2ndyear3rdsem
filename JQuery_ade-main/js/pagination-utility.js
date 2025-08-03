/**
 * Pagination & Infinite Scroll Utility
 * Reusable component for admin CRUD pages
 */

class PaginationUtility {
    constructor(options = {}) {
        this.options = {
            containerId: 'dataContainer',
            paginationBarId: 'paginationBar',
            paginationBarBottomId: 'paginationBarBottom',
            itemsPerPage: 10,
            infiniteScrollStep: 10,
            viewMode: 'pagination', // 'pagination' or 'infinite'
            onDataLoad: null,
            onItemRender: null,
            searchInputId: 'searchInput',
            filterInputs: [],
            ...options
        };
        
        this.currentPage = 1;
        this.infiniteScrollCount = 0;
        this.allData = [];
        this.filteredData = [];
        this.isLoading = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInfiniteScroll();
        this.renderViewModeToggle();
    }

    setupEventListeners() {
        // Pagination mode button
        $(document).on('click', '#paginationModeBtn', () => {
            this.setViewMode('pagination');
        });

        // Infinite scroll mode button
        $(document).on('click', '#infiniteScrollModeBtn', () => {
            this.setViewMode('infinite');
        });

        // Pagination bar clicks
        $(document).on('click', `#${this.options.paginationBarId} .page-link, #${this.options.paginationBarBottomId} .page-link`, (e) => {
            e.preventDefault();
            this.handlePaginationClick(e);
        });

        // Search functionality - Real-time search
        if (this.options.searchInputId) {
            // Real-time search as user types
            $(document).on('input', `#${this.options.searchInputId}`, () => {
                this.searchData();
            });

            // Search button (optional)
            $(document).on('click', '#searchBtn', () => {
                this.searchData();
            });

            // Clear search button
            $(document).on('click', '#clearSearchBtn', () => {
                $(`#${this.options.searchInputId}`).val('');
                this.searchData();
            });
        }

        // Filter functionality
        $(document).on('click', '#applyFiltersBtn', () => {
            this.applyFilters();
        });

        $(document).on('click', '#clearFiltersBtn', () => {
            this.clearFilters();
        });
    }

    setupInfiniteScroll() {
        $(window).off('scroll.infinite').on('scroll.infinite', () => {
            if (this.options.viewMode !== 'infinite') return;
            if (this.isLoading) return;
            
            if ($(window).scrollTop() + $(window).height() + 100 >= $(document).height()) {
                if (this.infiniteScrollCount < this.filteredData.length) {
                    this.infiniteScrollCount += this.options.infiniteScrollStep;
                    this.displayData();
                }
            }
        });
    }

    renderViewModeToggle() {
        const toggleHtml = `
            <div class="card mb-3" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%); border: 2px solid rgba(102, 126, 234, 0.1);">
                <div class="card-body py-2">
                    <div class="d-flex align-items-center justify-content-between">
                        <div>
                            <label class="mb-0"><strong><i class="fas fa-eye"></i> View Mode:</strong></label>
                            <small class="text-muted d-block">Choose how to display your data</small>
                        </div>
                        <div class="btn-group" role="group">
                            <button class="btn btn-outline-primary btn-sm" id="paginationModeBtn" title="Traditional pagination with page numbers">
                                <i class="fas fa-list"></i> Pagination
                            </button>
                            <button class="btn btn-outline-success btn-sm" id="infiniteScrollModeBtn" title="Load more items as you scroll">
                                <i class="fas fa-infinity"></i> Infinite Scroll
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="${this.options.paginationBarId}" class="mb-3"></div>
        `;
        
        // Insert after the first h1 or title element
        const titleElement = $('h1').first();
        if (titleElement.length) {
            titleElement.after(toggleHtml);
        } else {
            $('body').prepend(toggleHtml);
        }
        
        // Set initial button states
        this.updateButtonStates();
    }

    setViewMode(mode) {
        this.options.viewMode = mode;
        
        if (mode === 'pagination') {
            this.currentPage = 1;
            $(window).off('scroll.infinite');
        } else if (mode === 'infinite') {
            this.infiniteScrollCount = this.options.infiniteScrollStep;
            this.setupInfiniteScroll();
        }
        
        this.displayData();
        this.updateButtonStates();
    }

    updateButtonStates() {
        if (this.options.viewMode === 'pagination') {
            $('#paginationModeBtn').addClass('btn-primary').removeClass('btn-outline-primary');
            $('#infiniteScrollModeBtn').removeClass('btn-success').addClass('btn-outline-success');
        } else {
            $('#infiniteScrollModeBtn').addClass('btn-success').removeClass('btn-outline-success');
            $('#paginationModeBtn').removeClass('btn-primary').addClass('btn-outline-primary');
        }
    }

    handlePaginationClick(e) {
        const page = $(e.currentTarget).data('page');
        const totalPages = Math.ceil(this.filteredData.length / this.options.itemsPerPage);
        
        if (page === 'prev' && this.currentPage > 1) {
            this.currentPage--;
        } else if (page === 'next' && this.currentPage < totalPages) {
            this.currentPage++;
        } else if (typeof page === 'number' && page >= 1 && page <= totalPages) {
            this.currentPage = page;
        }
        
        this.displayData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    loadData(data) {
        this.allData = Array.isArray(data) ? data : [];
        this.filteredData = [...this.allData];
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    }

    displayData() {
        let displayData = this.filteredData;
        
        if (this.options.viewMode === 'pagination') {
            const startIdx = (this.currentPage - 1) * this.options.itemsPerPage;
            const endIdx = startIdx + this.options.itemsPerPage;
            displayData = this.filteredData.slice(startIdx, endIdx);
        } else if (this.options.viewMode === 'infinite') {
            displayData = this.filteredData.slice(0, this.infiniteScrollCount);
        }

        // Call custom render function if provided
        if (this.options.onItemRender) {
            this.options.onItemRender(displayData);
        } else {
            this.renderDefaultTable(displayData);
        }

        // Handle pagination bars based on view mode
        if (this.options.viewMode === 'pagination') {
            this.renderPaginationBar();
        } else {
            // Hide pagination bars when in infinite scroll mode
            $(`#${this.options.paginationBarId}`).html('');
            $(`#${this.options.paginationBarBottomId}`).html('');
            
            // Show infinite scroll status
            const totalItems = this.filteredData.length;
            const loadedItems = Math.min(this.infiniteScrollCount, totalItems);
            if (totalItems > 0) {
                const statusHtml = `
                    <div class="text-center text-muted mt-3">
                        <small>
                            <i class="fas fa-infinity"></i> 
                            Showing ${loadedItems} of ${totalItems} items
                            ${loadedItems < totalItems ? '<br><small>Scroll down to load more</small>' : ''}
                        </small>
                    </div>
                `;
                $(`#${this.options.paginationBarBottomId}`).html(statusHtml);
            }
        }

        // Call onDataLoad callback if provided
        if (this.options.onDataLoad) {
            this.options.onDataLoad(displayData);
        }
    }

    renderDefaultTable(data) {
        if (data.length === 0) {
            $(`#${this.options.containerId}`).html('<div class="alert alert-info">No data found.</div>');
            return;
        }

        // Create a simple table if no custom renderer is provided
        let html = '<div class="table-responsive"><table class="table table-striped">';
        html += '<thead><tr>';
        
        // Generate headers from first item
        if (data.length > 0) {
            Object.keys(data[0]).forEach(key => {
                if (key !== 'id' && !key.includes('_id')) {
                    html += `<th>${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</th>`;
                }
            });
            html += '<th>Actions</th>';
        }
        
        html += '</tr></thead><tbody>';
        
        data.forEach(item => {
            html += '<tr>';
            Object.keys(item).forEach(key => {
                if (key !== 'id' && !key.includes('_id')) {
                    html += `<td>${item[key] || ''}</td>`;
                }
            });
            html += '<td><div class="btn-group btn-group-sm"><button class="btn btn-primary btn-edit" data-id="' + (item.id || item.user_id || item.item_id) + '"><i class="fas fa-edit"></i></button></div></td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        $(`#${this.options.containerId}`).html(html);
    }

    renderPaginationBar() {
        const totalPages = Math.ceil(this.filteredData.length / this.options.itemsPerPage);
        
        if (totalPages <= 1) {
            $(`#${this.options.paginationBarId}`).html('');
            $(`#${this.options.paginationBarBottomId}`).html('');
            return;
        }

        let html = '<nav><ul class="pagination justify-content-center">';
        html += `<li class="page-item${this.currentPage === 1 ? ' disabled' : ''}"><a class="page-link" href="#" data-page="prev">&laquo;</a></li>`;
        
        // Show page numbers with ellipsis for large numbers
        const maxVisiblePages = 7;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                html += `<li class="page-item${i === this.currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }
        } else {
            // Show first page
            html += `<li class="page-item${this.currentPage === 1 ? ' active' : ''}"><a class="page-link" href="#" data-page="1">1</a></li>`;
            
            if (this.currentPage > 4) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            
            // Show pages around current page
            const start = Math.max(2, this.currentPage - 1);
            const end = Math.min(totalPages - 1, this.currentPage + 1);
            for (let i = start; i <= end; i++) {
                html += `<li class="page-item${i === this.currentPage ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
            }
            
            if (this.currentPage < totalPages - 3) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            
            // Show last page
            if (totalPages > 1) {
                html += `<li class="page-item${this.currentPage === totalPages ? ' active' : ''}"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
            }
        }
        
        html += `<li class="page-item${this.currentPage === totalPages ? ' disabled' : ''}"><a class="page-link" href="#" data-page="next">&raquo;</a></li>`;
        html += '</ul></nav>';
        
        $(`#${this.options.paginationBarId}`).html(html);
        $(`#${this.options.paginationBarBottomId}`).html(html);
    }

    searchData() {
        const searchTerm = $(`#${this.options.searchInputId}`).val().toLowerCase().trim();
        
        if (searchTerm === '') {
            this.filteredData = [...this.allData];
        } else {
            this.filteredData = this.allData.filter(item => {
                return Object.values(item).some(value => 
                    String(value).toLowerCase().includes(searchTerm)
                );
            });
        }
        
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    }

    applyFilters() {
        // This is a placeholder - implement specific filtering logic in child classes
        this.displayData();
    }

    clearFilters() {
        // Clear all filter inputs
        this.options.filterInputs.forEach(inputId => {
            $(`#${inputId}`).val('');
        });
        
        this.filteredData = [...this.allData];
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    }

    // Public methods for external use
    refresh() {
        this.currentPage = 1;
        this.infiniteScrollCount = this.options.infiniteScrollStep;
        this.displayData();
    }

    getCurrentData() {
        return this.filteredData;
    }

    getCurrentPage() {
        return this.currentPage;
    }

    getTotalPages() {
        return Math.ceil(this.filteredData.length / this.options.itemsPerPage);
    }
}

// Export for use in other modules
window.PaginationUtility = PaginationUtility; 