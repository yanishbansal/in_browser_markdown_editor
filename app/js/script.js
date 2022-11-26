import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    deleteDoc,
    db,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    getAuth,
    signOut,
} from "./firebase.js";

const app = document.querySelector(".app"),
    eyeBtn = document.querySelector(".eye"),
    eyeCrossedBtn = document.querySelector(".eye-crossed"),
    editorContainer = document.querySelector(".editor-container"),
    previewContainer = document.querySelector(".preview-container"),
    editorBox = document.querySelector(".editor-box"),
    previewBox = document.querySelector(".preview-box"),
    downloadBtn = document.querySelector(".download-button"),
    fileName = document.querySelector(".document-name").textContent,
    fileId = document.querySelector(".document-id"),
    readmeDocumentId = document.querySelector(".readme-document-id").value,
    hamburgerBtn = document.querySelector(".hamburger-button"),
    closeMenuBtn = document.querySelector(".close-menu-button"),
    slidingMenu = document.querySelector(".sliding-menu"),
    createDocumentInput = document.querySelector(
        ".create-new-document-container > input"
    ),
    documentListContainer = document.querySelector(".document-list-container"),
    documentName = document.querySelector(".document-name"),
    readmeTile = document.querySelector(".readme-tile"),
    logInWithGoogleBtn = document.querySelector(".log-in-with-google-button"),
    logoutBtn = document.querySelector(".logout-button"),
    authContainer = document.querySelector(".auth-container"),
    userId = document.querySelector(".user-id"),
    md = window.markdownit();

let width = 0,
    markdown = "",
    isPreviewVisible = false;

// Functions

const updateWidth = () => {
    width = window.innerWidth;
};

const updateIsPreviewVisible = () => {
    if (width <= 576) {
        isPreviewVisible = false;
    } else {
        isPreviewVisible = true;
    }
};

const displayEyeConditionally = (isPreviewVisible) => {
    if (isPreviewVisible) {
        hideElement(eyeCrossedBtn);
        showElement(eyeBtn);
    } else {
        showElement(eyeCrossedBtn);
        hideElement(eyeBtn);
    }
};

const displaySectionsConditionally = (width, isPreviewVisible) => {
    if (width <= 576) {
        if (isPreviewVisible) {
            showElement(previewContainer);
            hideElement(editorContainer);
        } else {
            showElement(editorContainer);
            hideElement(previewContainer);
        }
    } else {
        showElement(editorContainer);

        if (isPreviewVisible) {
            showElement(previewContainer);
        } else {
            hideElement(previewContainer);
        }
    }
};

const hideElement = (element) => {
    element.classList.add("hide");
    element.classList.remove("show");
};

const showElement = (element) => {
    element.classList.add("show");
    element.classList.remove("hide");
};

const updateMarkdown = () => {
    markdown = editorBox.value;
};

const renderMarkdown = (markdown) => {
    let result = md.render(markdown);
    previewBox.innerHTML = result;
};

const downloadFile = (fileName, text) => {
    var element = document.createElement("a");
    element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(text)
    );
    element.setAttribute("download", fileName + ".md");

    hideElement(element);

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

const setAnchorsTargetBlank = (anchors) => {
    anchors.forEach((anchor) => {
        anchor.setAttribute("target", "_blank");
    });
};

const createDocument = async (name) => {
    const doc = document.createElement("div");

    documentName.textContent = name;
    markdown = "";
    editorBox.value = markdown;

    renderMarkdown(markdown);

    const docRef = await addDataInFirestore(name, markdown);
    const docId = docRef.id;

    fileId.value = docId;

    appendDocumentTile(doc, name, docId);
    documentTileEditAndDeleteFn(doc, name, docId);
};

const documentTileEditAndDeleteFn = async (docDiv, name, docId) => {
    docDiv.addEventListener("click", async () => {
        const id = docDiv.querySelector(".tile-document-id").value;
        const doc_name = await loadDataFromFirestore(id);
        fileId.value = id;
        documentName.textContent = doc_name;
        closeMenuBtn.click();
    });

    const trashBtn = docDiv.querySelector(".trash-button");

    trashBtn.addEventListener("click", (evt) => {
        const deleteMarkdownPopup = document.createElement("div");

        appendDeleteMarkdownPopup(deleteMarkdownPopup, name);

        const markdownPopupCancelBtn = deleteMarkdownPopup.querySelector(
            ".markdown-popup-cancel-button"
        );

        markdownPopupCancelBtn.addEventListener("click", () => {
            app.classList.remove("overlay");
            document.body.removeChild(deleteMarkdownPopup);
        });

        const markdownPopupDeleteBtn = deleteMarkdownPopup.querySelector(
            ".markdown-popup-delete-button"
        );

        markdownPopupDeleteBtn.addEventListener("click", () => {
            deleteDataFromFirestore(docId);
            app.classList.remove("overlay");
            document.body.removeChild(deleteMarkdownPopup);
            documentListContainer.removeChild(docDiv);
        });

        evt.stopPropagation();
    });

    const renameBtn = docDiv.querySelector(".rename-button");
    let renameBtnClicked = false;

    renameBtn.addEventListener("click", (evt) => {
        if (renameBtnClicked) renameBtnClicked = false;
        else renameBtnClicked = true;

        toggleRenameBtnFn();
        evt.stopPropagation();
    });

    const toggleRenameBtnFn = () => {
        if (renameBtnClicked) {
            hideElement(docDiv.querySelector(".md-doc-name"));
            showElement(docDiv.querySelector(".edit-name-input"));
            renameBtn.src = "/img/cross.svg";
            renameBtn.alt = "cross";

            const editNameInput = docDiv.querySelector(".edit-name-input");

            editNameInput.addEventListener("click", (evt) => {
                evt.stopPropagation();
            });

            editNameInput.addEventListener("keydown", (evt) => {
                if (evt.key === "Enter") {
                    checkAndUpdateName(editNameInput.value);
                }
                evt.stopPropagation();
            });

            const checkAndUpdateName = async (name) => {
                name = name.trim();
                const prevName =
                    docDiv.querySelector(".md-doc-name").textContent;

                if (name.length === 0 || name === prevName) {
                    console.log("Please enter a valid name!");
                } else {
                    const id = docDiv.querySelector(".tile-document-id").value;
                    const docRef = doc(db, "markdowns", id);
                    const docSnap = await getDoc(docRef);

                    const dataObj = {
                        uid: userId.value,
                        docName: name,
                        markdown: docSnap.data().markdown,
                    };
                    updateDataInFirestore(id, dataObj);
                    showElement(docDiv.querySelector(".md-doc-name"));
                    hideElement(docDiv.querySelector(".edit-name-input"));

                    docDiv.querySelector(".md-doc-name").textContent = name;
                    renameBtn.src = "/img/pencil.svg";
                    renameBtn.alt = "pencil";
                    docDiv.querySelector(".edit-name-input").value = "";
                }
            };
        } else {
            showElement(docDiv.querySelector(".md-doc-name"));
            hideElement(docDiv.querySelector(".edit-name-input"));
            renameBtn.src = "/img/pencil.svg";
            renameBtn.alt = "pencil";
            docDiv.querySelector(".edit-name-input").value = "";
        }
    };
};

const appendDocumentTile = (element, name, documentId) => {
    element.setAttribute(
        "class",
        "document sliding-menu-document-tile flex flex-ai-c"
    );

    element.innerHTML = `
        <img src="/img/hastag.svg" alt="hastag" />
        <p class="md-doc-name">${name}</p>
        <input class="edit-name-input hide" type="text" placeholder="Enter new name" />
        <img class="rename-button" src="/img/pencil.svg" alt="pencil" />
        <img class="trash-button" src="/img/trash.svg" alt="trash" />
        <input class="tile-document-id" type="hidden" value=${documentId}>
    `;

    documentListContainer.appendChild(element);
};

const appendDeleteMarkdownPopup = (element, name) => {
    element.setAttribute("class", "delete-markdown-popup");

    element.innerHTML = `
            <div
                class="delete-markdown-popup-text-container flex flex-dir-col"
            >
                <p>"${name}" will be permanently deleted.</p>
                <p>You won't be able to undo this action.</p>
            </div>
            <div
                class="delete-markdown-popup-buttons-container flex flex-ai-c"
            >
                <a
                    class="markdown-popup-button markdown-popup-cancel-button flex flex-jc-c flex-ai-c"
                    href="#"
                    >Cancel</a
                >
                <a
                    class="markdown-popup-button markdown-popup-delete-button flex flex-jc-c flex-ai-c"
                    href="#"
                    >Delete</a
                >
            </div>
        `;

    closeMenuBtn.click();
    app.classList.add("overlay");
    document.body.appendChild(element);
};

const addDataInFirestore = async (documentName, markdown) => {
    try {
        const docRef = await addDoc(collection(db, "markdowns"), {
            uid: userId.value,
            docName: documentName,
            markdown: markdown,
        });
        console.log("Document written with ID: ", docRef.id);
        return docRef;
    } catch (e) {
        console.error("Error adding document: ", e);
    }
};

const updateDataInFirestore = async (documentId, data) => {
    await setDoc(doc(db, "markdowns", documentId), data);
};

const loadDataFromFirestore = async (documentId) => {
    const docRef = doc(db, "markdowns", documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        documentName.textContent = docSnap.data().docName;
        if (docSnap.data().markdown === "") {
            markdown = "";
        } else {
            markdown = extractMarkdownFromFirestoreObj(docSnap.data().markdown);
        }
        editorBox.value = markdown;
        renderMarkdown(markdown);
        return documentName.textContent;
    } else {
        console.log("No such document!");
    }
};

const getAllDocFromFirestore = async () => {
    const querySnapshot = await getDocs(collection(db, "markdowns"));
    querySnapshot.forEach((doc) => {
        if (doc.id !== readmeDocumentId && doc.data().uid == userId.value)
            loadAllDocumentTile(doc.id, doc.data().docName);
    });
};

const extractMarkdownFromFirestoreObj = (arr) => {
    let ans = "";

    arr.forEach((str) => {
        if (str === "") {
            ans += "\n\n";
        } else {
            ans += str;
        }
    });

    return ans;
};

const deleteDataFromFirestore = async (docId) => {
    await deleteDoc(doc(db, "markdowns", docId));
    markdown = "";
    editorBox.value = markdown;
    renderMarkdown(markdown);
    readmeTile.click();
};

const loadAllDocumentTile = (documentId, docName) => {
    const doc = document.createElement("div");
    appendDocumentTile(doc, docName, documentId);
    documentTileEditAndDeleteFn(doc, docName, documentId);
};

// Event listners

window.addEventListener("resize", () => {
    updateWidth();
    displayEyeConditionally(isPreviewVisible);
    displaySectionsConditionally(width, isPreviewVisible);
});

eyeBtn.addEventListener("click", () => {
    isPreviewVisible = false;
    displayEyeConditionally(isPreviewVisible);
    displaySectionsConditionally(width, isPreviewVisible);
});

eyeCrossedBtn.addEventListener("click", () => {
    isPreviewVisible = true;
    displayEyeConditionally(isPreviewVisible);
    displaySectionsConditionally(width, isPreviewVisible);
});

editorBox.addEventListener("input", () => {
    updateMarkdown();
    renderMarkdown(markdown);

    const markdownObj = {
        uid: userId.value,
        docName: documentName.textContent,
        markdown: markdown.split("\n"),
    };

    if (fileId.value !== readmeDocumentId) {
        updateDataInFirestore(fileId.value, markdownObj);
    } else {
        console.log("User can't make changes to README!");
    }

    const previewBox_Anchors = previewBox.querySelectorAll("a");
    setAnchorsTargetBlank(previewBox_Anchors);
});

downloadBtn.addEventListener("click", () => {
    downloadFile(documentName.textContent, markdown);
});

hamburgerBtn.addEventListener("click", () => {
    app.classList.add("overlay");
    slidingMenu.classList.add("active");
});

closeMenuBtn.addEventListener("click", () => {
    app.classList.remove("overlay");
    slidingMenu.classList.remove("active");
});

createDocumentInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const documentName = createDocumentInput.value;
        if (documentName === "") {
            console.log("Please enter a valid document name!");
        } else {
            createDocument(documentName);
            createDocumentInput.value = "";
        }
    }
});

readmeTile.addEventListener("click", async () => {
    await loadDataFromFirestore(readmeDocumentId);
    closeMenuBtn.click();
});

const provider = new GoogleAuthProvider();
const auth = getAuth();

logInWithGoogleBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            userId.value = user.uid;
            hideElement(authContainer);
            showElement(app);
        })
        .catch((error) => {
            console.log(error.message);
        });
});

logoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            hideElement(app);
            showElement(authContainer);
            authContainer.style = "display : flex !important";
        })
        .catch((error) => {
            console.log(error.message);
        });
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        userId.value = user.uid;
        hideElement(authContainer);
        showElement(app);
    } else {
        hideElement(app);
        showElement(authContainer);
        authContainer.style = "display : flex !important";
    }
});

// Variables and Function calls

updateWidth();
updateIsPreviewVisible();
renderMarkdown(markdown);

const previewBox_Anchors = previewBox.querySelectorAll("a");
setAnchorsTargetBlank(previewBox_Anchors);

readmeTile.click();

getAllDocFromFirestore();
