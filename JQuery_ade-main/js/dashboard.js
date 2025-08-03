$(document).ready(function () {
    const url = 'http://localhost:4000/';
    const jwtToken = sessionStorage.getItem('jwtToken');
    
    // Check for admin role
    let isAdmin = false;
    if (jwtToken) {
        try {
            const payload = JSON.parse(atob(jwtToken.split('.')[1]));
            if (payload.role && payload.role === 'admin') {
                isAdmin = true;
            }
        } catch (e) {
            isAdmin = false;
        }
    }
    
    if (!isAdmin) {
        Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'Only authorized admin can access this page.',
            confirmButtonText: 'Go to Home',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'home.html';
        });
        return;
    }

    // 1. Bar Chart: Monthly Sales Revenue
    $.ajax({
        method: "GET",
        url: `${url}api/v1/dashboard/monthly-sales-chart`,
        dataType: "json",
        headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
        success: function (data) {
            console.log('Monthly Sales Data:', data);
            if (data.success && data.data) {
                const chartData = data.data;
                var ctx = $("#salesChart");

                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: chartData.map(row => row.month),
                        datasets: [{
                            label: 'Monthly Sales Revenue (₱)',
                            data: chartData.map(row => parseFloat(row.total_revenue || 0)),
                            backgroundColor: 'rgba(102, 126, 234, 0.8)',
                            borderColor: 'rgba(102, 126, 234, 1)',
                            borderWidth: 2,
                            borderRadius: 8,
                            borderSkipped: false,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: false
                            },
                            legend: {
                                display: true,
                                labels: {
                                    color: '#2c3e50',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(102, 126, 234, 0.9)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#667eea',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.1)',
                                    borderColor: 'rgba(102, 126, 234, 0.2)'
                                },
                                ticks: {
                                    color: '#2c3e50',
                                    font: {
                                        weight: 'bold'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.1)',
                                    borderColor: 'rgba(102, 126, 234, 0.2)'
                                },
                                ticks: {
                                    color: '#2c3e50',
                                    font: {
                                        weight: 'bold'
                                    },
                                    callback: function(value) {
                                        return '₱' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }
        },
        error: function (xhr) {
            console.error('Monthly Sales Chart Error:', xhr);
            let msg = xhr.status === 401 ? 'Unauthorized access' : 'Failed to load monthly sales data';
            if (xhr.status === 401) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }
    });

    // 2. Line Chart: Orders Over Time
    $.ajax({
        type: "GET",
        url: `${url}api/v1/dashboard/orders-over-time-chart`,
        dataType: "json",
        headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
        success: function (data) {
            console.log('Orders Over Time Data:', data);
            if (data.success && data.data) {
                const chartData = data.data;
                var ctx = $("#addressChart");
                
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map(row => {
                            const date = new Date(row.order_date);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }),
                        datasets: [
                            {
                                label: 'Total Orders',
                                data: chartData.map(row => parseInt(row.total_orders || 0)),
                                borderColor: '#667eea',
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#667eea',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 3,
                                pointRadius: 6,
                                pointHoverRadius: 8
                            },
                            {
                                label: 'Delivered Orders',
                                data: chartData.map(row => parseInt(row.delivered_orders || 0)),
                                borderColor: '#27ae60',
                                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#27ae60',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 3,
                                pointRadius: 6,
                                pointHoverRadius: 8
                            },
                            {
                                label: 'Processing Orders',
                                data: chartData.map(row => parseInt(row.processing_orders || 0)),
                                borderColor: '#00d4ff',
                                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: '#00d4ff',
                                pointBorderColor: '#ffffff',
                                pointBorderWidth: 3,
                                pointRadius: 6,
                                pointHoverRadius: 8
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: false
                            },
                            legend: {
                                display: true,
                                labels: {
                                    color: '#2c3e50',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    },
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(102, 126, 234, 0.9)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#667eea',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: true
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.1)',
                                    borderColor: 'rgba(102, 126, 234, 0.2)'
                                },
                                ticks: {
                                    color: '#2c3e50',
                                    font: {
                                        weight: 'bold'
                                    }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(102, 126, 234, 0.1)',
                                    borderColor: 'rgba(102, 126, 234, 0.2)'
                                },
                                ticks: {
                                    color: '#2c3e50',
                                    font: {
                                        weight: 'bold'
                                    },
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
        },
        error: function (xhr) {
            console.error('Orders Over Time Chart Error:', xhr);
            let msg = xhr.status === 401 ? 'Unauthorized access' : 'Failed to load orders data';
            if (xhr.status === 401) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }
    });

    // 3. Pie Chart: Top Selling Categories
    $.ajax({
        type: "GET",
        url: `${url}api/v1/dashboard/top-categories-chart`,
        dataType: "json",
        headers: jwtToken ? { 'Authorization': 'Bearer ' + jwtToken } : {},
        success: function (data) {
            console.log('Top Categories Data:', data);
            if (data.success && data.data) {
                const chartData = data.data;
                var ctx = $("#itemsChart");
                
                // Generate GadgetEssence theme colors
                const generateGadgetColors = (count) => {
                    const baseColors = [
                        { bg: 'rgba(102, 126, 234, 0.8)', border: '#667eea' },
                        { bg: 'rgba(118, 75, 162, 0.8)', border: '#764ba2' },
                        { bg: 'rgba(0, 212, 255, 0.8)', border: '#00d4ff' },
                        { bg: 'rgba(39, 174, 96, 0.8)', border: '#27ae60' },
                        { bg: 'rgba(231, 76, 60, 0.8)', border: '#e74c3c' },
                        { bg: 'rgba(241, 196, 15, 0.8)', border: '#f1c40f' },
                        { bg: 'rgba(155, 89, 182, 0.8)', border: '#9b59b6' },
                        { bg: 'rgba(52, 152, 219, 0.8)', border: '#3498db' }
                    ];
                    
                    const colors = [];
                    const borderColors = [];
                    
                    for (let i = 0; i < count; i++) {
                        const colorIndex = i % baseColors.length;
                        colors.push(baseColors[colorIndex].bg);
                        borderColors.push(baseColors[colorIndex].border);
                    }
                    
                    return { colors, borderColors };
                };

                const { colors, borderColors } = generateGadgetColors(chartData.length);

                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: chartData.map(row => row.category),
                        datasets: [{
                            label: 'Items Sold',
                            data: chartData.map(row => parseInt(row.total_sold || 0)),
                            backgroundColor: colors,
                            borderColor: borderColors,
                            borderWidth: 3,
                            hoverBorderWidth: 4,
                            hoverOffset: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: false
                            },
                            legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                    color: '#2c3e50',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    },
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(102, 126, 234, 0.9)',
                                titleColor: '#ffffff',
                                bodyColor: '#ffffff',
                                borderColor: '#667eea',
                                borderWidth: 2,
                                cornerRadius: 8,
                                displayColors: true,
                                callbacks: {
                                    label: function(context) {
                                        const dataIndex = context.dataIndex;
                                        const category = chartData[dataIndex];
                                        const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                        return [
                                            `${context.label}: ${context.parsed} items (${percentage}%)`,
                                            `Revenue: ₱${parseFloat(category.total_revenue || 0).toLocaleString()}`,
                                            `Products: ${category.items_count || 0}`
                                        ];
                                    }
                                }
                            }
                        }
                    }
                });
            }
        },
        error: function (xhr) {
            console.error('Top Categories Chart Error:', xhr);
            let msg = xhr.status === 401 ? 'Unauthorized access' : 'Failed to load categories data';
            if (xhr.status === 401) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }
    });
});