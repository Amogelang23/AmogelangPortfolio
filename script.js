import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUwM9nMNGHX8Z6y8oCUfDh9EnFx44vZTs",
  authDomain: "amogelangportfolio.firebaseapp.com",
  projectId: "amogelangportfolio",
  storageBucket: "amogelangportfolio.firebasestorage.app",
  messagingSenderId: "617209917649",
  appId: "1:617209917649:web:d7cb2670494b6f35f215f0",
  measurementId: "G-FPQL0S91Y8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("currentYear").textContent = new Date().getFullYear();
const authBtn = document.getElementById('authBtn');
const addProjectBtn = document.getElementById('addProjectBtn');
const loginModal = document.getElementById('loginModal');
const projectModal = document.getElementById('projectModal');
const websitesGrid = document.getElementById('websites-grid');
const appsGrid = document.getElementById('apps-grid');
const projCategory = document.getElementById('projCategory');
const apkLinkContainer = document.getElementById('apkLinkContainer');

let isAdmin = false;

const heroCard = document.querySelector(".hero-tilt");
if (heroCard) {
    heroCard.addEventListener("mousemove", (e) => {
        const rect = heroCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (centerY - y) / 30;
        const rotateY = (x - centerX) / 30;
        heroCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    heroCard.addEventListener("mouseleave", () => {
        heroCard.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        isAdmin = true;
        authBtn.textContent = "Logout";
        addProjectBtn.classList.remove('hidden');
    } else {
        isAdmin = false;
        authBtn.textContent = "Admin Login";
        addProjectBtn.classList.add('hidden');
    }
    loadProjects(); 
});

authBtn.addEventListener('click', () => {
    if (isAdmin) {
        signOut(auth);
    } else {
        loginModal.classList.remove('hidden');
    }
});

document.getElementById('closeLogin').addEventListener('click', () => loginModal.classList.add('hidden'));

document.getElementById('submitLogin').addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginModal.classList.add('hidden');
    } catch (error) {
        alert("Login failed: " + error.message);
    }
});

projCategory.addEventListener('change', (e) => {
    if (e.target.value === 'app') {
        apkLinkContainer.classList.remove('hidden');
    } else {
        apkLinkContainer.classList.add('hidden');
    }
});

addProjectBtn.addEventListener('click', () => {
    document.getElementById('projectId').value = '';
    document.getElementById('projTitle').value = '';
    document.getElementById('projIcon').value = '';
    document.getElementById('projDesc').value = '';
    document.getElementById('projWebLink').value = '';
    document.getElementById('projApkLink').value = '';
    document.getElementById('modalTitle').textContent = 'Add Project';
    projectModal.classList.remove('hidden');
});

document.getElementById('closeProject').addEventListener('click', () => projectModal.classList.add('hidden'));

document.getElementById('saveProjectBtn').addEventListener('click', async () => {
    const id = document.getElementById('projectId').value;
    const projectData = {
        title: document.getElementById('projTitle').value,
        category: document.getElementById('projCategory').value,
        icon: document.getElementById('projIcon').value,
        description: document.getElementById('projDesc').value,
        webLink: document.getElementById('projWebLink').value,
        apkLink: document.getElementById('projApkLink').value,
    };

    try {
        if (id) {
            await updateDoc(doc(db, "projects", id), projectData);
        } else {
            await addDoc(collection(db, "projects"), projectData);
        }
        projectModal.classList.add('hidden');
        loadProjects();
    } catch (error) {
        alert("Error saving project: " + error.message);
    }
});

async function loadProjects() {
    websitesGrid.innerHTML = '';
    appsGrid.innerHTML = '';
    
    const querySnapshot = await getDocs(collection(db, "projects"));
    
    querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const id = docSnap.id;
        
        let actionButtons = '';
        if (isAdmin) {
            actionButtons = `
                <div class="admin-actions">
                    <button class="action-btn edit-btn" data-id="${id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-btn delete-btn" data-id="${id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
        }

        let linkButton = '';
        if (data.category === 'app' && data.apkLink) {
            linkButton = `<a href="${data.apkLink}" download class="view-btn">Download APK <i class="fa-solid fa-arrow-right"></i></a>`;
        } else if (data.webLink) {
            linkButton = `<a href="${data.webLink}" target="_blank" class="view-btn">View Project <i class="fa-solid fa-arrow-right"></i></a>`;
        }

        const cardHTML = `
            <div class="flip-card">
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        ${actionButtons}
                        <div class="icon-box"><i class="${data.icon}"></i></div>
                        <h3>${data.title}</h3>
                        <p style="color: #aaa; margin-top: 10px;">Hover for info</p>
                    </div>
                    <div class="flip-card-back">
                        <h3>${data.title}</h3>
                        <p style="margin: 10px 0; color: #ccc;">${data.description}</p>
                        ${linkButton}
                    </div>
                </div>
            </div>
        `;

        if (data.category === 'app') {
            appsGrid.insertAdjacentHTML('beforeend', cardHTML);
        } else {
            websitesGrid.insertAdjacentHTML('beforeend', cardHTML);
        }
    });

    attachAdminListeners();
}

function attachAdminListeners() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation(); 
            if(confirm('Are you sure you want to delete this project?')) {
                const id = btn.getAttribute('data-id');
                await deleteDoc(doc(db, "projects", id));
                loadProjects();
            }
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const querySnapshot = await getDocs(collection(db, "projects"));
            let targetData = null;
            querySnapshot.forEach(d => { if(d.id === id) targetData = d.data(); });
            
            if(targetData) {
                document.getElementById('projectId').value = id;
                document.getElementById('projTitle').value = targetData.title;
                document.getElementById('projCategory').value = targetData.category;
                document.getElementById('projIcon').value = targetData.icon;
                document.getElementById('projDesc').value = targetData.description;
                document.getElementById('projWebLink').value = targetData.webLink || '';
                document.getElementById('projApkLink').value = targetData.apkLink || '';
                
                if (targetData.category === 'app') {
                    apkLinkContainer.classList.remove('hidden');
                } else {
                    apkLinkContainer.classList.add('hidden');
                }
                
                document.getElementById('modalTitle').textContent = 'Edit Project';
                projectModal.classList.remove('hidden');
            }
        });
    });
}

loadProjects();