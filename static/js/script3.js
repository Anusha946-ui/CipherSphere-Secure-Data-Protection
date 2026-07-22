document.addEventListener("DOMContentLoaded", () => {
    const encryptBtn = document.getElementById("encryptBtn");
    const decryptBtn = document.getElementById("decryptBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const resetBtn = document.getElementById("resetBtn");

    const fileInput = document.getElementById("file");
    const keyInput = document.getElementById("key");

    const formSuccess = document.getElementById("formSuccess");
    const customDialog = document.getElementById("customDialog");
    const customDialogMessage = document.getElementById("customDialogMessage");
    const customDialogClose = document.getElementById("customDialogClose");
    const customDialogOk = document.getElementById("customDialogOk");

    let successTimeout;

    function showCustomDialog(message) {
        customDialogMessage.textContent = message;
        customDialog.style.display = "block";
    }

    function hideCustomDialog() {
        customDialog.style.display = "none";
    }

    function showSuccessMessage(message) {
        clearTimeout(successTimeout);
        formSuccess.textContent = message;
        formSuccess.style.display = "block";
        formSuccess.style.backgroundColor = "#d4edda";
        formSuccess.style.border = "1px solid #c3e6cb";
        formSuccess.style.padding = "10px 15px";
        formSuccess.style.borderRadius = "6px";
        formSuccess.style.marginTop = "10px";
        formSuccess.style.color = "#155724";
        formSuccess.style.textAlign = "center";

        successTimeout = setTimeout(() => {
            formSuccess.style.display = "none";
        }, 3000); // Auto-hide after 3 seconds
    }

    function clearSuccessMessage() {
        formSuccess.textContent = "";
        formSuccess.style.display = "none";
        clearTimeout(successTimeout);
    }

    customDialogClose.onclick = hideCustomDialog;
    customDialogOk.onclick = hideCustomDialog;

    // Update to use the correct route for image encryption
    encryptBtn.onclick = async () => {
        clearSuccessMessage();
        const file = fileInput.files[0];
        const key = keyInput.value;

        if (!file && !key) return showCustomDialog("Both image and key are required.");
        if (!file) return showCustomDialog("Please choose an image to encrypt.");
        if (!key) return showCustomDialog("Please enter key.");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);

        try {
            const res = await fetch("/encrypt-image", { method: "POST", body: formData });  // Changed route to "/encrypt-image"
            const data = await res.json();

            if (res.ok) {
                showSuccessMessage("Image encrypted successfully!");
            } else {
                showCustomDialog(data.message || "Encryption failed.");
            }
        } catch (err) {
            showCustomDialog("An error occurred during encryption.");
        }
    };

    // Update to use the correct route for image decryption
    decryptBtn.onclick = async () => {
        clearSuccessMessage();
        const file = fileInput.files[0];
        const key = keyInput.value;

        if (!file && !key) return showCustomDialog("Both encrypted image and key are required.");
        if (!file) return showCustomDialog("Please choose an encrypted image.");
        if (!key) return showCustomDialog("Please enter key.");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("key", key);

        try {
            const res = await fetch("/decrypt-image", { method: "POST", body: formData });  // Changed route to "/decrypt-image"
            const data = await res.json();

            if (res.ok) {
                showSuccessMessage("Image decrypted successfully!");
            } else {
                showCustomDialog(data.message || "Decryption failed.");
            }
        } catch (err) {
            showCustomDialog("An error occurred during decryption.");
        }
    };

    downloadBtn.onclick = async () => {
        clearSuccessMessage();
    
        try {
            const res = await fetch("/download");
    
            const contentType = res.headers.get("Content-Type") || "";
    
            //  If it's a JSON error (not an image), show dialog
            if (!res.ok || contentType.includes("application/json")) {
                const data = await res.json();
                return showCustomDialog(data.message || "No result to download.");
            }
    
            //  Otherwise, it's a real file (image/octet-stream)
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "output_image.png";
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            showCustomDialog("An error occurred while downloading.");
        }
    };
    
    
    resetBtn.onclick = () => {
        clearSuccessMessage();
        const fileFilled = fileInput.value !== "";
        const keyFilled = keyInput.value !== "";

        if (fileFilled || keyFilled) {
            fileInput.value = "";
            keyInput.value = "";
            showSuccessMessage("Form reset successful.");
        } else {
            showCustomDialog("Form is already empty");
        }
    };
});



