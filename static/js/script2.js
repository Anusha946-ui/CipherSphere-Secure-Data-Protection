// Function to update file status and show file size
function updateFileStatus() {
    const fileInput = document.getElementById("file");
    const fileStatus = document.getElementById("fileStatus");
    const fileSize = document.getElementById("fileSize");
    
    if (fileInput.files.length === 0) {
        fileStatus.innerText = "No file chosen";
        fileSize.innerText = "";  // Clear file size when no file is chosen
    } else {
        const file = fileInput.files[0];
        const fileName = file.name;
        fileStatus.innerText = `File chosen: ${fileName}`;

        // Format and display the file size
        const size = file.size; // in bytes
        const formattedSize = formatFileSize(size);
        fileSize.innerText = `Size: ${formattedSize}`;
    }
}

// Function to format file size into human-readable format (KB, MB)
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
}


// Function to show success messages in a dialog box
function showSuccessDialog(message) {
    const successMessage = document.getElementById("successMessage");
    successMessage.innerText = message;
    const successDialog = document.getElementById("successDialog");
    successDialog.showModal();
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
    input.accept = "*/*"; // Allow all file types for loading
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

// Function to check valid file types
function isValidFile(file) {
    const allowedExtensions = ['txt'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    return allowedExtensions.includes(fileExtension);
}

let isEncrypted = false; // Track whether content is encrypted or decrypted


// Function to check file size
function isFileSizeValid(file) {
    const maxSize = 10 * 1024 * 1024; // 10 MB (in bytes)
    return file.size <= maxSize;
}

// Function to encrypt the file
function encryptFile() {
    const file = document.getElementById("file").files[0];
    const key = document.getElementById("key").value;

    if (!file && !key) {
        showErrorDialog("Both file and key are required!");
        return;
    }
    if (!file) {
        showErrorDialog("Please choose file to encrypt");
        return;
    }
    if (!key) {
        showErrorDialog("Please enter key");
        return;
    }
    // Check if the file size is valid (<= 10 MB)
    if (!isFileSizeValid(file)) {
         showErrorDialog("File size exceeds the 10MB limit. Please choose a smaller file.");
         return;
    }

    // Check if the file is empty
    if (file.size === 0) {
        showErrorDialog("Selected file is empty. Please choose a valid file.");
        return;
    }

    // Check if the file extension is valid
    if (!isValidFile(file)) {
        showErrorDialog("Invalid file type! Only .txt files are allowed.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;

        fetch("/encrypt-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: fileContent, key })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("result").value = data.encrypted_content;
                showSuccessMessage("File encryption successful!");
                isEncrypted = true; // Set encrypted state
            } else {
                showErrorDialog(data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showErrorDialog("Encryption failed!");
        });
    };
    reader.readAsText(file);
}

// Function to decrypt the file
function decryptFile() {
    const file = document.getElementById("file").files[0];
    const key = document.getElementById("key").value;

    if (!file && !key) {
        showErrorDialog("Both encrypted file and key are required!");
        return;
    }
    if (!file) {
        showErrorDialog("Please choose encrypted file");
        return;
    }
    if (!key) {
        showErrorDialog("Please enter key");
        return;
    }

    // Check if the file is empty
    if (file.size === 0) {
        showErrorDialog("Selected file is empty. Please choose a valid file.");
        return;
    }

    // Check if the selected file has the .enc extension (only .enc files can be decrypted)
    if (file.name.slice(-4) !== ".enc") {
        showErrorDialog("Please select a valid .enc file for decryption.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const encryptedContent = e.target.result;

        fetch("/decrypt-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ encrypted_content: encryptedContent, key })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("result").value = data.decrypted_content;
                showSuccessMessage("File decryption successful!");
                isEncrypted = false; // Set decrypted state
            } else {
                showErrorDialog(data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showErrorDialog("Decryption failed!");
        });
    };
    reader.readAsText(file);
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

// Function to show error messages in the dialog box
function showErrorDialog(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.innerText = message;
    const errorDialog = document.getElementById("errorDialog");
    errorDialog.showModal();
}



// Function to copy the result to clipboard
function copyToClipboard() {
    const resultText = document.getElementById("result").value;
    if (resultText) {
        navigator.clipboard.writeText(resultText)
            .then(() => showSuccessMessage("Result copied to clipboard!"))
            .catch(() => showErrorDialog("Failed to copy to clipboard."));
    } else {
        showErrorDialog("No result to copy!");
    }
}
// Function to reset the form

/// Function to reset the form
function resetData() {
    const fileInput = document.getElementById("file");
    const keyInput = document.getElementById("key");
    const resultText = document.getElementById("result");

    // Check if the form is empty
    if (!fileInput.value && !keyInput.value && !resultText.value) {
        // If the form is empty, show error dialog
        showErrorDialog("Form is already empty!");
        return;  // Exit the function without proceeding with reset
    }

    // Clear the file input
    fileInput.value = "";

    // Reset the file status text to "No file chosen"
    const fileStatus = document.getElementById("fileStatus");
    fileStatus.innerText = "No file chosen";

    // Reset the file size display
    const fileSize = document.getElementById("fileSize");
    fileSize.innerText = "";  // Clear the file size display

    // Clear the key input and result text
    keyInput.value = "";
    resultText.value = "";

    // Hide any messages or dialogs
    document.getElementById("message").style.display = "none";
    closeDialog('successDialog');
    closeDialog('errorDialog');

    // Show success message for reset
    showSuccessMessage("Form has been reset successfully!");
}


// Function to save the file (either encrypted or decrypted)
async function saveFile() {
    const resultText = document.getElementById("result").value.trim(); // Get the result content

    // Check if the resultText is empty
    if (!resultText) {
        // Show error dialog if no result
        showErrorDialog("No result to save!");
        return; // Prevent opening file picker if no result
    }

    try {
        // Default file name suggestion based on content
        let suggestedName = "output"; // Default name
        let fileExtension = ".txt";  // Default to .txt (for decrypted files)

        // If the content is encrypted, change the extension to .enc
        if (isEncrypted) {
            fileExtension = ".enc";  // Encrypted file should have .enc extension
            suggestedName = "encrypted_data";  // Suggested name for encrypted files
        } else {
            suggestedName = "decrypted_data";  // Suggested name for decrypted files
        }

        // Open the file save dialog using the File System Access API
        const handle = await window.showSaveFilePicker({
            suggestedName: suggestedName + fileExtension, // Default file name suggestion
            types: [
                { description: "Text Files", accept: { "text/plain": [".txt"] } }, // For decrypted content
                { description: "Encrypted Files", accept: { "application/octet-stream": [".enc"] } } // For encrypted content
            ]
        });

        // Create a writable stream to write content to the selected file
        const writable = await handle.createWritable();
        await writable.write(resultText);  // Write the content (either encrypted or decrypted) to the file
        await writable.close();  // Close the writable stream to finalize the file saving

        // Show success dialog after saving the file
        showSuccessDialog("File saved successfully !");
    } catch (error) {
        // Handle any errors that occur during the file save process
        console.error("File save failed:", error);
        showErrorDialog("Sorry, your data could not be saved. Please try again.");
    }
}
