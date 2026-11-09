
const imageInput = document.getElementById("fridgeImage");
const imagePreview = document.getElementById("imagePreview");
const uploadZone = document.getElementById("uploadZone");
const fileStatus = document.getElementById("fileStatus");
const analyzeButton = document.getElementById("analyzeButton");
const demoNotice = document.getElementById("demoNotice");

let selectedImage = null;
let previewUrl = null;

// Create AI results area automatically
const resultsSection = document.createElement("section");
resultsSection.id = "aiResults";
resultsSection.style.cssText = `
    display: none;
    margin-top: 25px;
    padding: 22px;
    border-radius: 14px;
    background: #f5f8f5;
    color: #24352b;
`;

if (demoNotice) {
    demoNotice.insertAdjacentElement("afterend", resultsSection);
}

function displayImage(file) {
    if (!file || !file.type.startsWith("image/")) {
        alert("Please select a valid image.");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert("Please select an image smaller than 10 MB.");
        return;
    }

    selectedImage = file;

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(file);
    imagePreview.src = previewUrl;
    imagePreview.hidden = false;

    fileStatus.textContent = file.name;
    analyzeButton.disabled = false;

    resultsSection.style.display = "none";

    demoNotice.textContent =
        "Image selected successfully. Ready for AI analysis.";
}

// Select image
imageInput.addEventListener("change", (event) => {
    displayImage(event.target.files[0]);
});

// Drag and drop
uploadZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    uploadZone.classList.add("dragging");
});

uploadZone.addEventListener("dragleave", () => {
    uploadZone.classList.remove("dragging");
});

uploadZone.addEventListener("drop", (event) => {
    event.preventDefault();
    uploadZone.classList.remove("dragging");

    const file = event.dataTransfer.files[0];

    if (file) {
        displayImage(file);
    }
});

// Display AI detection results
function displayResults(result) {
    resultsSection.innerHTML = "";
    resultsSection.style.display = "block";

    const title = document.createElement("h2");
    title.textContent = "AI Detection Results";
    resultsSection.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.textContent =
        "Your fridge image has been analyzed successfully.";
    resultsSection.appendChild(subtitle);

    // Group repeated detections by ingredient
    const grouped = {};

    result.detections.forEach(item => {
        if (
            !grouped[item.name] ||
            item.confidence > grouped[item.name]
        ) {
            grouped[item.name] = item.confidence;
        }
    });

    const ingredientsTitle = document.createElement("h3");
    ingredientsTitle.textContent = "Detected Ingredients";
    resultsSection.appendChild(ingredientsTitle);

    const ingredientList = document.createElement("div");
    ingredientList.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin: 15px 0;
    `;

    const ingredients = Object.entries(grouped);

    if (ingredients.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent =
            "No ingredients detected. Try another image.";
        ingredientList.appendChild(emptyMessage);
    }

    ingredients.forEach(([name, confidence]) => {
        const card = document.createElement("div");

        card.style.cssText = `
            background: white;
            border: 1px solid #dce8df;
            border-radius: 10px;
            padding: 14px;
            min-width: 130px;
        `;

        const itemName = document.createElement("strong");
        itemName.textContent = name;

        const itemConfidence = document.createElement("p");
        itemConfidence.textContent =
            `Confidence: ${confidence.toFixed(2)}%`;

        card.appendChild(itemName);
        card.appendChild(itemConfidence);
        ingredientList.appendChild(card);
    });

    resultsSection.appendChild(ingredientList);

    // Show annotated image
    if (result.annotated_image) {
        const imageTitle = document.createElement("h3");
        imageTitle.textContent = "AI Analyzed Image";
        resultsSection.appendChild(imageTitle);

        const annotatedImage = document.createElement("img");
        annotatedImage.src = result.annotated_image;
        annotatedImage.alt = "AI detected ingredients";

        annotatedImage.style.cssText = `
            display: block;
            width: 100%;
            max-width: 550px;
            height: auto;
            border-radius: 12px;
            margin-top: 12px;
        `;

        resultsSection.appendChild(annotatedImage);
    }
}

// Send image to Python backend
analyzeButton.addEventListener("click", async () => {
    if (!selectedImage) return;

    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analyzing...";

    demoNotice.textContent =
        "AI is analyzing your fridge image...";

    resultsSection.style.display = "none";

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/scan",
            {
                method: "POST",
                body: formData
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || "Analysis failed.");
        }

        displayResults(result);

        demoNotice.textContent =
            "Food detection completed successfully!";

    } catch (error) {
        demoNotice.textContent =
            "Could not analyze the image.";

        alert("ERROR: " + error.message);

    } finally {
        analyzeButton.disabled = false;
        analyzeButton.textContent = "Analyze my fridge ↗";
    }
});

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("mobile-open");
    });

    navLinks.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("mobile-open");
        });
    });
}
