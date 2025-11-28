// Debug: Check if script is loading
console.log('Dashboard script loaded');

// Fetch and display user information
async function loadUserInfo() {
    console.log('Loading user info...');
    try {
        const response = await fetch('/api/auth/user');
        const data = await response.json();
        
        console.log('User data:', data);
        
        if (data.success) {
            const user = data.user;
            document.getElementById('userName').textContent = user.username;
            document.getElementById('userNameDisplay').textContent = user.username;
            document.getElementById('userUsername').textContent = user.username;
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('profileName').textContent = user.username;
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('userFullName').textContent = user.fullName || user.username;
            
            // Format date
            const createdDate = new Date(user.createdAt);
            document.getElementById('userCreatedAt').textContent = createdDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else {
            // DON'T redirect - just show error
            console.log('Not authenticated');
            document.body.innerHTML = '<h1 style="color:red; padding:20px;">Not authenticated. Please <a href="/">login</a></h1>';
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        // DON'T redirect - just show error
        document.body.innerHTML = '<h1 style="color:red; padding:20px;">Error loading dashboard: ' + error.message + '</h1>';
    }
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Logout error:', error);
        // Redirect anyway
        window.location.href = '/';
    }
});

// Sidebar navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page-content');
const pageTitle = document.getElementById('pageTitle');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        const pageName = item.dataset.page;
        document.getElementById(pageName + '-page').classList.add('active');
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'profile': 'My Profile',
            'jobs': 'Job Opportunities',
            'career-guidance': 'Career Guidance',
            'resume': 'My Resume',
            'messages': 'Messages'
        };
        pageTitle.textContent = titles[pageName];
    });
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    }
});

// Load user info when page loads
loadUserInfo();
