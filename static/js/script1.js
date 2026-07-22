 
// Function to toggle the password visibility
function togglePassword() {
    const keyField = document.getElementById("key");
    const passwordButton = document.getElementById("password-toggle");

    if (keyField.type === "password") {
        keyField.type = "text";
        passwordButton.innerText = "Hide Key";  // Change text to "Hide"
    } else {
        keyField.type = "password";
        passwordButton.innerText = "Show Key";  // Change text to "Show"
    }
}

// Function to show success messages in the message div
function showSuccessMessage(message) {
    const messageDiv = document.getElementById("message");
    messageDiv.innerText = message;
    messageDiv.style.display = "block";
    messageDiv.className = "success";

    // Hide the success message after 5 seconds
    setTimeout(() => {
        messageDiv.style.display = "none";
    }, 5000);
}

// Function to show success messages in a dialog box
function showSuccessDialog(message) {
    const successMessage = document.getElementById("successMessage");
    successMessage.innerText = message;
    const successDialog = document.getElementById("successDialog");
    successDialog.showModal();
}

// Function to show error messages in a dialog box
function showErrorDialog(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = message;
    const errorDialog = document.getElementById("errorDialog");
    errorDialog.showModal();
}

// Function to close the dialog box
function closeDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    dialog.close();
}

// Function to load file content into the text area
function loadFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById("text").value = e.target.result;
                showSuccessDialog("File loaded successfully!");
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Function to encrypt the text
function encryptText() {
    const text = document.getElementById("text").value;
    const key = document.getElementById("key").value;

    if (!text && !key) {
        showErrorDialog("Both text and key are required!");
        return;
    }
    if (!key) {
        showErrorDialog("Please enter key.");
        return;
    }
    if (!text) {
        showErrorDialog("Please enter text to encrypt.");
        return;
    }

    fetch("/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, key })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById("result").value = data.encrypted_text;
            showSuccessMessage("Encryption successful!");
        } else {
            showErrorDialog(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        showErrorDialog("Encryption failed!");
    });
}

// Function to decrypt the text
function decryptText() {
    const encrypted_text = document.getElementById("text").value;
    const key = document.getElementById("key").value;

    if (!encrypted_text && !key) {
        showErrorDialog("Both encrypted text and key are required!");
        return;
    }

    if (!key) {
        showErrorDialog("Please enter key.");
        return;
    }
    if (!encrypted_text) {
        showErrorDialog("Please enter encrypted text.");
        return;
    }

    fetch("/decrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ encrypted_text, key })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById("result").value = data.decrypted_text;
            showSuccessMessage("Decryption successful!");
        } else {
            showErrorDialog(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        showErrorDialog("Decryption failed!");
    });
}

// Function to copy the result to clipboard
function copyToClipboard() {
    const resultTextElement = document.getElementById("result");

    // Check if the result text exists
    if (resultTextElement && resultTextElement.value.trim() !== "") {
        const resultText = resultTextElement.value;

        // Use the Clipboard API if available
        navigator.clipboard.writeText(resultText)
            .then(() => {
                showSuccessMessage("Result copied to clipboard!");
            })
            .catch((err) => {
                console.error("Error copying text: ", err);
                showErrorDialog("Failed to copy to clipboard.");
            });
    } else {
        showErrorDialog("No result to copy!");
    }
}

// Function to save the result text to a file
async function saveFile() {
    const resultText = document.getElementById("result").value.trim(); // trim() to ensure there are no unwanted spaces

    // Check if the resultText is empty
    if (!resultText) {
        // Show error dialog if no result
        showErrorDialog("No result to save!");
        return; // Prevent opening file picker if no result
    }

    try {
        // Open the file save dialog using the File System Access API
        const handle = await window.showSaveFilePicker({
            suggestedName: "result.txt", // Default file name suggestion
            types: [{ description: "Text Files", accept: { "text/plain": [".txt"] } }] // Only accept .txt files
        });

        // Create a writable stream to write content to the selected file
        const writable = await handle.createWritable();
        await writable.write(resultText);  // Write the content to the file
        await writable.close();  // Close the writable stream to finalize the file saving

        // Show success dialog after saving the file
        showSuccessDialog("Data saved successfully!");
    } catch (error) {
        // Handle any errors that occur during the file save process
        console.error("File save failed:", error);
        showErrorDialog("Sorry,your data could not be saved.Please try again.");
    }
}



// Function to reset the form
function resetData() {
    const text = document.getElementById("text").value.trim();
    const key = document.getElementById("key").value.trim();
    const result = document.getElementById("result").value.trim();

    if (!text && !key && !result) {
        // If the form is already empty
        showErrorDialog("Form is already empty!");
    } else {
        // Reset all fields
        document.getElementById("text").value = "";
        document.getElementById("key").value = "";
        document.getElementById("result").value = "";
        
        // Show success message
        showSuccessMessage("Form has been reset successfully!");
    }}