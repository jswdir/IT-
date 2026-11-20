let userBalance = 0;
let userName = "";
let transactions = [];
let selectedProductId = null;
let userId = "";
let previousSection = null;
let productId = "";
let product = { }
document.getElementById("actionButtons").style.display = "none";
function logout() {
    // 사용자 정보 초기화
    userBalance = 0;
    userName = "";
    userId = "";
    
    // 로그인 페이지로 이동
    showSection("login");
    document.getElementById("actionButtons").style.display = "none";
}
const favoriteHtml = `
    <span id="favorite-icon-${productId}" class="favorite-icon ${product.isFavorite ? "favorite-active" : ""}" onclick="toggleFavorite('${productId}')">❤️</span>
    <span id="favorite-count-${productId}" class="favorite-count">${product.favorites || 0}</span>
`;

function showSection(sectionId) {
    const sections = ["login", "register", "mainPage", "myPage", "sellPage", "productDetailPage", "mySalesPage", "wishlistPage", "searchResultsPage"];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.add("d-none");
    });

    document.getElementById(sectionId).classList.remove("d-none");

    const actionButtons = document.getElementById("actionButtons");
    if (sectionId === "mainPage") {
        if (actionButtons) actionButtons.classList.remove("d-none");
    } else {
        if (actionButtons) actionButtons.classList.add("d-none");
    }

    const backButton = document.getElementById("backButton");
    if (backButton) {
        if (sectionId === "mainPage" || sectionId === "login") {
            backButton.classList.add("d-none");
        } else {
            backButton.classList.remove("d-none");
            backButton.onclick = () => {
                if (sectionId === "sellPage") {
                    showSection("mainPage");
                } else if (previousSection) {
                    showSection(previousSection);
                } else {
                    showSection("mainPage");
                }
            };
        }
    }

    if (sectionId === "searchResultsPage" || sectionId === "mySalesPage") {
        previousSection = "mainPage";
    } else if (sectionId !== "login") {
        previousSection = sectionId;
    }
}


function searchItems() {
    const searchBar = document.getElementById("searchBar").value.toLowerCase();
    fetch("http://localhost:8080/products")
        .then(response => response.json())
        .then(products => {
            const filteredProducts = Object.entries(products).filter(([id, product]) =>
                product.name.toLowerCase().includes(searchBar)
            );
            displaySearchResults(filteredProducts);
            showSection("searchResultsPage");
        })
        .catch(error => console.error("Error searching products:", error));
}

function displaySearchResults(products) {
    const searchResultsList = document.getElementById("searchResultsList");
    searchResultsList.innerHTML = "";

    if (products.length === 0) {
        searchResultsList.innerHTML = "<p>검색 결과가 없습니다.</p>";
    } else {
        products.forEach(([id, product]) => {
            const productCard = document.createElement("div");
            productCard.classList.add("card", "m-2");
            productCard.style.width = "18rem";

            productCard.innerHTML = `
                <img src="${product.mainImage}" class="card-img-top" alt="Product Image">
                <div class="card-body">
                    <h5 class="card-title">${product.name}</h5>
                    <p class="card-text"><strong>${product.price.toLocaleString()} 원</strong></p>
                    <div class="favorite-section">
                        <span id="favorite-icon-${id}" class="favorite-icon" onclick="toggleFavorite('${id}')">❤️</span>
                        <span id="favorite-count-${id}">${product.favorites || 0}</span>
                    </div>
                </div>
            `;
            productCard.onclick = () => showProductDetail(product, id);
            searchResultsList.appendChild(productCard);
        });
    }
}

function showMySalesPage() {
    fetch(`http://localhost:8080/user_sales?userId=${userId}`)
        .then(response => response.json())
        .then(items => {
            const mySalesList = document.getElementById("mySalesList");
            mySalesList.innerHTML = "";

            if (Object.keys(items).length === 0) {
                mySalesList.innerHTML = "<p>등록된 판매 상품이 없습니다.</p>";
            } else {
                Object.entries(items).forEach(([id, item]) => {
                    const itemCard = document.createElement("div");
                    itemCard.classList.add("card", "m-2");
                    itemCard.style.width = "18rem";

                    let buttonsHtml = "";
                    if (item.status === "거래 완료") {
                        buttonsHtml = `
                            <p class="text-danger"><strong>거래 완료</strong></p>
                            <button class="btn btn-danger" onclick="deleteProduct('${id}')">삭제하기</button>
                        `;
                    } else {
                        buttonsHtml = `
                            <button class="btn btn-primary" onclick="editProduct('${id}')">수정하기</button>
                            <button class="btn btn-danger" onclick="deleteProduct('${id}')">삭제하기</button>
                        `;
                    }

                    itemCard.innerHTML = `
                        <img src="${item.mainImage}" class="card-img-top" alt="Product Image">
                        <div class="card-body">
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text"><strong>${item.price.toLocaleString()} 원</strong></p>
                            <small class="text-muted">${new Date(item.dateAdded).toLocaleDateString()}</small>
                            ${buttonsHtml}
                        </div>
                    `;
                    itemCard.onclick = () => showProductDetail(item, id);
                    mySalesList.appendChild(itemCard);
                });
            }

            showSection("mySalesPage");
        })
        .catch(error => console.error("Error loading sales items:", error));
}

function showProductDetail(product, productId) {
    const productDetail = document.getElementById("productDetail");
    const imagesHtml = product.images.map(img => `<img src="${img}" class="img-fluid mb-2" alt="Product Image">`).join("");
    const isOwner = product.sellerId === userId; 
    const favoriteHtml = !isOwner ? `
        <button id="favorite-icon-${productId}" class="favorite-icon ${product.isFavorite ? "favorite-active" : ""}" onclick="toggleFavorite('${productId}')">찜하기</span>
    ` : ''; 
    const favoriteCountHtml = `<span id="favorite-count-${productId}" class="ms-2">${product.favorites || 0}명 찜</span>`;

    const priceText = product.price !== undefined ? `${product.price.toLocaleString()} 원` : "가격 정보 없음";
    let actionButtons = "";

    
    if (product.sellerId === userId) {
        if (product.status === "거래 완료") {
            actionButtons = `<button class="btn btn-danger" onclick="deleteProduct('${productId}')">삭제하기</button>`;
        } else {
            actionButtons = `
                <button class="btn btn-primary" onclick="editProduct('${productId}')">수정하기</button>
                <button class="btn btn-danger" onclick="deleteProduct('${productId}')">삭제하기</button>
            `;
        }
    } else {
        actionButtons = `<button class="btn btn-success" onclick="purchaseProduct('${productId}', ${product.price})">구매하기</button>`;
    }

    productDetail.innerHTML = `
        ${imagesHtml}
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p><strong>가격: ${product.price.toLocaleString()} 원</strong></p>
        <p><strong>판매자: ${product.sellerName || "Unknown"}</strong></p>
        ${actionButtons}
    `;

    showSection("productDetailPage");
}




function transitionToMainPage() {
    showSection("mainPage");
    loadProductList();
    document.getElementById("logoutButton").style.display = "block"; 
}

function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "Login successful") {
            userBalance = data.balance;
            userName = data.name;
            userId = data.userId;
            transitionToMainPage();
            const logoutButton = document.getElementById("logoutButton");
            if (logoutButton) {
                logoutButton.style.display = "block";
            } else {
                console.error("logoutButton element not found.");
            }
        } else {
            document.getElementById("loginMessage").innerText = data.message;
        }
    })
    .catch(error => console.error("Error during login:", error));
}

function register() {
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;
    const name = document.getElementById("registerName").value;
    const balance = parseInt(document.getElementById("registerBalance").value);

    fetch("http://localhost:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name, balance })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === "User registered successfully") {
            userBalance = balance;
            userName = name;
            userId = data.userId;
            transitionToMainPage();
        } else {
            document.getElementById("registerMessage").innerText = data.message;
        }
    })
    .catch(error => console.error("Error during registration:", error));
}


function showMyPage() {
    document.getElementById("profileName").innerText = userName;
    document.getElementById("accountBalance").innerText = `${userBalance} 원`;
    showSection("myPage");
}

function loadMySales() {
    fetch(`http://localhost:8080/user_sales?userId=${userId}`)
        .then(response => response.json())
        .then(items => {
            const mySalesList = document.getElementById("mySalesList");
            mySalesList.innerHTML = "";

            if (Object.keys(items).length === 0) {
                mySalesList.innerHTML = "<p>등록된 판매 상품이 없습니다.</p>";
            } else {
                Object.values(items).forEach(item => {
                    const itemCard = document.createElement("div");
                    itemCard.classList.add("card", "m-2");
                    itemCard.style.width = "18rem";
                    itemCard.innerHTML = `
                        <img src="${item.image}" class="card-img-top" alt="Product Image">
                        <div class="card-body">
                            <h5 class="card-title">${item.name}</h5>
                            <p class="card-text">가격: ${item.price} 원</p>
                            <p class="card-text">판매자: ${item.sellerName || userName}</p>
                        </div>
                    `;
                    itemCard.onclick = () => showProductDetail(item);
                    mySalesList.appendChild(itemCard);
                });
            }
        })
        .catch(error => console.error("Error loading sales items:", error));
}

function showWishlistPage() {
    loadWishlist();
    showSection("wishlistPage");
}


function showSellPage() {
    showSection("sellPage");
}

function showMainPage() {
    showSection("mainPage");
    loadProductList();
    document.getElementById("logoutButton").style.display = "block"; // 로그아웃 버튼 표시
}
function toggleFavorite(productId, detailPage = false) {
    fetch(`http://localhost:8080/toggle_favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productId, userId: userId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const favoriteIcon = document.getElementById(`favorite-icon-${productId}`);
            const favoriteCount = document.getElementById(`favorite-count-${productId}`);
            const favoriteCountDetail = document.getElementById(`favorite-count-detail-${productId}`);

            if (favoriteIcon) {
                favoriteIcon.classList.toggle("favorite-active", data.favoriteStatus);
            }

            if (favoriteCount) {
                favoriteCount.innerHTML = `${data.favorites || 0}명 찜`;
            }
            if (detailPage && favoriteCountDetail) {
                favoriteCountDetail.innerHTML = `${data.favorites || 0}`;
            }

            if (!detailPage) {
                loadMyFavorites();
            }
        } else {
            alert("찜하기 기능을 사용할 수 없습니다. 다시 시도해 주세요.");
        }
    })
    .catch(error => {
        console.error("Error toggling favorite:", error);
        alert("찜하기 기능에 문제가 발생했습니다.");
    });
}


function loadMyFavorites() {
    fetch(`http://localhost:8080/get_favorites?userId=${userId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(favorites => {
            const wishlist = document.getElementById("wishlistList");
            wishlist.innerHTML = "";

            const favoriteItems = Array.isArray(favorites) ? favorites : Object.entries(favorites);

            if (favoriteItems.length === 0) {
                wishlist.innerHTML = "<p>찜한 상품이 없습니다.</p>";
            } else {
                favoriteItems.forEach(([id, product]) => {  
                    const itemCard = document.createElement("div");
                    itemCard.classList.add("card", "m-2");
                    itemCard.style.width = "18rem";

                    const isCompleted = product.status === "거래 완료";

                    itemCard.innerHTML = `
                        <img src="${product.mainImage}" class="card-img-top" alt="Product Image">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.price.toLocaleString()} 원</p>
                            ${isCompleted ? `<p class="text-danger">거래 완료</p>` : ""}
                        </div>
                    `;

                    if (!isCompleted) {
                        const favoriteSection = document.createElement("div");
                        favoriteSection.classList.add("d-flex", "align-items-center");

                        favoriteSection.innerHTML = `
                            <span id="favorite-icon-${id}" class="favorite-icon ${product.isFavorite ? "favorite-active" : ""}" onclick="toggleFavorite('${id}')">❤️</span>
                            <span id="favorite-count-${id}" class="ms-2">${product.favorites || 0}명 찜</span>
                        `;
                        
                        const purchaseButton = document.createElement("button");
                        purchaseButton.classList.add("btn", "btn-success", "mt-2");
                        purchaseButton.textContent = "구매하기";
                        purchaseButton.onclick = (e) => {
                            e.stopPropagation(); 
                            purchaseProduct(id, product.price); 
                        };

                        itemCard.querySelector(".card-body").appendChild(favoriteSection);
                        itemCard.querySelector(".card-body").appendChild(purchaseButton);
                    }

                    itemCard.addEventListener("click", () => showProductDetail(product, id)); 
                    wishlist.appendChild(itemCard);
                });
            }
            showSection("wishlistPage");
        })
        .catch(error => {
            console.error("Error loading wishlist items:", error);
            alert("Unable to load wishlist items. Please check your connection to the server.");
        });
}

function loadProductList() {
    fetch("http://localhost:8080/products")
        .then(response => response.json())
        .then(products => {
            displayProductList(products);
        })
        .catch(error => console.error("Error loading products:", error));
}

function displayProductList(products) {
    const productList = document.getElementById("productList");
    productList.innerHTML = "";

    Object.entries(products).forEach(([id, product]) => {
        if (product.status === "거래 완료") return;
        
        const productCard = document.createElement("div");
        productCard.classList.add("card", "m-2");
        productCard.style.width = "18rem";

        const favoriteButtonHtml = product.sellerId !== userId ? `
            <span id="favorite-icon-${id}" class="favorite-icon" onclick="toggleFavorite('${id}')">❤️</span>
        ` : ''; 
        const favoriteCountHtml = `<span id="favorite-count-${id}">${product.favorites || 0}명 찜</span>`; 

        productCard.innerHTML = `
            <img src="${product.mainImage}" class="card-img-top" alt="Product Image">
            <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text"><strong>${product.price.toLocaleString()} 원</strong></p>
                <div class="favorite-section d-flex align-items-center">
                    ${favoriteButtonHtml}
                    ${favoriteCountHtml}
                </div>
            </div>
        `;

        productCard.onclick = () => showProductDetail(product, id);
        productList.appendChild(productCard);
    });
}

loadProductList();


function sellProduct() {
    const productName = document.getElementById("productName").value;
    const productDescription = document.getElementById("productDescription").value;
    const productPrice = parseInt(document.getElementById("productPrice").value);
    const productImageFiles = document.getElementById("productImage").files;

    if (productImageFiles.length > 5) {
        alert("최대 5개의 이미지만 등록할 수 있습니다.");
        return;
    }

    if (productImageFiles.length > 0) {
        let images = [];
        const readerPromises = Array.from(productImageFiles).map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => {
                    images.push(reader.result);
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readerPromises).then(() => {
            const mainImage = images[0];

            fetch("http://localhost:8080/add_product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: productName,
                    description: productDescription,
                    price: productPrice,
                    images: images,
                    mainImage: mainImage,
                    sellerName: userName,
                    userId: userId
                })
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                loadProductList(); // 메인 페이지 상품 목록 새로고침
                loadMySales(); // 내 판매상품 목록 새로고침
                showSection("mainPage"); // 메인 페이지로 이동
            })
            .catch(error => console.error("Error adding product:", error));
        });
    } else {
        alert("상품 이미지를 최소 한 장 첨부해 주세요.");
    }
}


function editProduct(productId) {
    selectedProductId = productId; // 수정할 상품 ID 저장

    // 상품 정보를 불러와서 수정 화면에 표시
    fetch("http://localhost:8080/products")
        .then(response => response.json())
        .then(products => {
            const product = products[productId];
            if (product) {
                // 기존 상품 등록 입력 필드에 수정할 정보 로드
                document.getElementById("productName").value = product.name;
                document.getElementById("productDescription").value = product.description;
                document.getElementById("productPrice").value = product.price;
                showSection("sellPage"); // 기존 등록 화면을 사용하여 수정 페이지 표시

                // 뒤로 가기 버튼 활성화
                const backButton = document.getElementById("backButton");
                backButton.classList.remove("d-none");
                backButton.onclick = () => {
                    if (confirm("수정 사항을 취소하고 이전 페이지로 돌아가시겠습니까?")) {
                        loadProductList(); // 메인 페이지로 이동
                        showSection("mainPage");
                    }
                };

                // 선택한 파일 초기화
                document.getElementById("productImage").value = ""; 
            } else {
                alert("상품 정보를 불러올 수 없습니다.");
            }
        })
        .catch(error => console.error("Error fetching product details:", error));
}



function deleteProduct(productId) {
    if (confirm("Are you sure you want to delete this product?")) {
        fetch(`http://localhost:8080/delete_product/${productId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Product deleted successfully!");
                loadProductList(); 
                loadMySales();
            } else {
                alert(data.message || "Failed to delete product");
            }
        })
        .catch(error => console.error("Error deleting product:", error));
    }
}

function saveProductChanges() {
    const updatedName = document.getElementById("productName").value;
    const updatedDescription = document.getElementById("productDescription").value;
    const updatedPrice = parseInt(document.getElementById("productPrice").value);
    const updatedImages = Array.from(document.getElementById("productImage").files);

    // 이미지 파일 읽기
    const imagesData = updatedImages.map(file => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(imagesData).then(images => {
        fetch(`http://localhost:8080/edit_product`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: selectedProductId,
                name: updatedName,
                description: updatedDescription,
                price: updatedPrice,
                images: images,
                mainImage: images[0]  
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("상품이 성공적으로 수정되었습니다.");
                loadProductList();
                showSection("mainPage"); 
            } else {
                alert("상품 수정에 실패했습니다.");
            }
        })
        .catch(error => console.error("Error updating product:", error));
    });
}

function purchaseProduct(productId, productPrice) {
    const confirmPurchase = confirm("상품을 구매하시겠습니까?");
    if (!confirmPurchase) return;

    fetch(`http://localhost:8080/purchase/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            buyer: userId,
            buyerBalance: userBalance,
            productPrice: productPrice
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("구매가 완료되었습니다!");
            userBalance -= productPrice; 
            loadProductList(); 
            previousSection("mainPage");
            showSection("mainPage");
        } else {
            alert(data.message || "구매에 실패했습니다.");
        }
    })
    .catch(error => console.error("Error during purchase:", error));
}
function chargePoints() {
    const chargeAmount = parseInt(document.getElementById("chargeAmount").value);

    if (isNaN(chargeAmount) || chargeAmount <= 0) {
        alert("유효한 금액을 입력하세요.");
        return;
    }

    fetch("http://localhost:8080/charge_points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, amount: chargeAmount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            userBalance += chargeAmount; 
            document.getElementById("accountBalance").innerText = `${userBalance} 원`;
            alert("포인트 충전이 완료되었습니다!");
        } else {
            alert(data.message || "포인트 충전에 실패했습니다. 다시 시도하세요.");
        }
    })
    .catch(error => console.error("Error charging points:", error));
}


function withdrawPoints() {
    const withdrawAmount = parseInt(document.getElementById("withdrawAmount").value);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        alert("유효한 금액을 입력하세요.");
        return;
    }

    if (withdrawAmount > userBalance) {
        alert("잔액이 부족합니다.");
        return;
    }

    fetch("http://localhost:8080/withdraw_points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, amount: withdrawAmount })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            userBalance -= withdrawAmount; // 잔액 업데이트
            document.getElementById("accountBalance").innerText = `${userBalance} 원`;
            alert("포인트 빼내기가 완료되었습니다!");
        } else {
            alert("포인트 빼내기에 실패했습니다. 다시 시도하세요.");
        }
    })
    .catch(error => console.error("Error withdrawing points:", error));
}
function transitionToMainPage() {
    showSection("mainPage");
    loadProductList();

    // const logoutButton = document.getElementById("logoutButton");
    // if (logoutButton) {
    //     logoutButton.style.display = "block";
    // } else {
    //     console.error("logoutButton element not found.");
    // }

    const actionButtons = document.getElementById("actionButtons");
    if (actionButtons) {
        actionButtons.style.display = "flex";
    } else {
        console.error("actionButtons element not found.");
    }
}
function showProductDetail(product, productId) {
    const productDetail = document.getElementById("productDetail");
    if (!productDetail) {
        console.error("productDetail element not found.");
        return;
    }

    const imagesHtml = (product.images || []).map(img => `<img src="${img}" class="img-fluid mb-2" alt="Product Image">`).join("");
    const isOwner = product.sellerId === userId;
    
    const favoriteHtml = !isOwner ? `
        <button id="favorite-icon-${productId}" class="btn btn-primary ${product.isFavorite ? "favorite-active" : ""}" onclick="toggleFavorite('${productId}', true)">찜하기 ❤️ <span id="favorite-count-detail-${productId}">${product.favorites || 0}</span></button>
    ` : '';

    const priceText = product.price !== undefined ? `${product.price.toLocaleString()} 원` : "가격 정보 없음";
    const isCompleted = product.status === "거래 완료";

    const actionButtons = isOwner ? (
        isCompleted ? `<p class="text-danger">거래 완료</p><button class="btn btn-danger" onclick="deleteProduct('${productId}')">삭제하기</button>` :
        `<button class="btn btn-primary" onclick="editProduct('${productId}')">수정하기</button>
         <button class="btn btn-danger" onclick="deleteProduct('${productId}')">삭제하기</button>`
    ) : (
        isCompleted ? `<p class="text-danger">거래 완료</p>` : `
        <button class="btn btn-success" onclick="purchaseProduct('${productId}', ${product.price})">구매하기</button>
        ${favoriteHtml}`
    );

    productDetail.innerHTML = `
        ${imagesHtml}
        <h3>${product.name || "상품 이름 없음"}</h3>
        <p>${product.description || "설명 없음"}</p>
        <p><strong>가격: ${priceText}</strong></p>
        <p><strong>판매자: ${product.sellerName || "Unknown"}</strong></p>
        ${actionButtons}
    `;

    const backButton = document.getElementById("backButton");
    if (backButton) {
        backButton.classList.remove("d-none");
        backButton.onclick = showMainPage;
    } else {
        console.error("backButton element not found.");
    }

    showSection("productDetailPage");
}

document.querySelectorAll(".btn-secondary").forEach(button => {
    button.onclick = showMainPage;
});
