from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from datetime import datetime

USER_DATA_FILE = 'users.json'
MARKET_DATA_FILE = 'market.json'

def load_data(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return json.load(file)
    return {}

def save_data(file_path, data):
    try:
        with open(file_path, 'w') as file:
            json.dump(data, file, indent=4)
        print(f"Data successfully saved to {file_path}")
    except Exception as e:
        print(f"Error saving data to {file_path}: {e}")

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _respond(self, response):
        self.wfile.write(json.dumps(response).encode())

    def serve_static_file(self, file_path, content_type="text/html"):
        try:
            with open(file_path, 'rb') as file:
                self._set_headers(200, content_type)
                self.wfile.write(file.read())
        except FileNotFoundError:
            self._set_headers(404)
            self._respond({"message": "File not found"})

    def do_GET(self):
        if self.path == "/":
            self.serve_static_file("index.html", "text/html")
        elif self.path == "/script.js":
            self.serve_static_file("script.js", "application/javascript")
        elif self.path == "/style.css":
            self.serve_static_file("style.css", "text/css")
        elif self.path == "/products":
            self.handle_get_products()
        elif self.path.startswith("/products/"):
            self.handle_get_product_by_id()
        elif self.path.startswith("/user_sales"):
            self.handle_user_sales()
        elif self.path.startswith("/get_favorites"):
            self.handle_get_favorites()
        else:
            self._set_headers(404)
            self._respond({"message": "Endpoint not found"})

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        if self.path == "/register":
            self.handle_register()
        elif self.path == "/login":
            self.handle_login()
        elif self.path == "/add_product":
            self.handle_add_product()
        elif self.path == "/edit_product":
            self.handle_update_product()
        elif self.path.startswith("/purchase/"):  
            self.handle_purchase()
        elif self.path == "/toggle_favorite":  
            self.handle_toggle_favorite()
        elif self.path == "/charge_points":  
            self.handle_charge_points()
        elif self.path == "/withdraw_points": 
            self.handle_withdraw_points()
        else:
            self._set_headers(404)
            self._respond({"message": "Endpoint not found"})
    def serve_static_file(self, file_path, content_type="text/html"):
        try:
            with open(file_path, 'rb') as file:
                self._set_headers(200, content_type)
                self.wfile.write(file.read())
        except FileNotFoundError:
            self._set_headers(404)
            self._respond({"message": "File not found"})

    def do_DELETE(self):
        if self.path.startswith("/delete_product/"):
            self.handle_delete_product()
        else:
            self._set_headers(404)
            self._respond({"message": "Endpoint not found"})

    def handle_delete_product(self):
        product_id = self.path.split("/")[-1]
        products = load_data(MARKET_DATA_FILE)
        
        if product_id in products:
            del products[product_id]
            save_data(MARKET_DATA_FILE, products)
            self._set_headers(200)
            self._respond({"success": True, "message": "Product deleted successfully"})
        else:
            self._set_headers(404)
            self._respond({"success": False, "message": "Product not found"})
    def handle_get_products(self):
        try:
            products = load_data(MARKET_DATA_FILE)
            self._set_headers()
            self._respond(products)
        except json.JSONDecodeError:
            print("Error: Failed to parse market.json")
            self._set_headers(500)
            self._respond({"error": "Failed to load products. Please check the server log for details."})
    def handle_get_product_by_id(self):
        product_id = self.path.split("/")[-1]
        products = load_data(MARKET_DATA_FILE)
        
        if product_id in products:
            self._set_headers()
            self._respond(products[product_id])
        else:
            self._set_headers(404)
            self._respond({"message": "Product not found"})

    def handle_update_product(self):
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        product_id = post_data.get("productId")
        products = load_data(MARKET_DATA_FILE)

        if product_id in products:
            products[product_id].update({
                "name": post_data.get("name"),
                "description": post_data.get("description"),
                "price": post_data.get("price"),
                "images": post_data.get("images"),
                "mainImage": post_data.get("mainImage"),
                "dateUpdated": datetime.now().isoformat()
            })
            save_data(MARKET_DATA_FILE, products)
            self._set_headers(200)
            self._respond({"success": True, "message": "Product updated successfully"})
        else:
            self._set_headers(404)
            self._respond({"success": False, "message": "Product not found"})

    def handle_register(self):
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        username, password, name, balance = post_data.get("username"), post_data.get("password"), post_data.get("name"), post_data.get("balance")
        users = load_data(USER_DATA_FILE)

        if username in users:
            self._set_headers(400)
            self._respond({"message": "User already exists"})
        else:
            users[username] = {"password": password, "name": name, "balance": int(balance)}
            save_data(USER_DATA_FILE, users)
            self._set_headers()
            self._respond({"message": "User registered successfully"})

    def handle_login(self):
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        username, password = post_data.get("username"), post_data.get("password")
        users = load_data(USER_DATA_FILE)
        
        if users.get(username, {}).get("password") == password:
            self._set_headers()
            user = users[username]
            self._respond({"message": "Login successful", "userId": username, "name": user["name"], "balance": user["balance"]})
        else:
            self._set_headers(401)
            self._respond({"message": "Invalid username or password"})

    def handle_add_product(self):
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        products = load_data(MARKET_DATA_FILE)

        seller_id = post_data.get("userId")
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")

        product_key = f"{seller_id}_{timestamp}"
        products[product_key] = {
            "name": post_data.get("name"),
            "description": post_data.get("description"),
            "price": int(post_data.get("price")),
            "images": post_data.get("images"),
            "mainImage": post_data.get("mainImage"),
            "sellerName": post_data.get("sellerName"),
            "sellerId": seller_id,
            "dateAdded": datetime.now().isoformat()
        }
        save_data(MARKET_DATA_FILE, products)
        self._set_headers()
        self._respond({"message": "Product added successfully"})
    def handle_withdraw_points(self):
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        user_id = post_data.get("userId")
        amount = post_data.get("amount")

        if not user_id or not amount or amount <= 0:
            self._set_headers(400)
            self._respond({"success": False, "message": "유효하지 않은 요청입니다."})
            return

        users = load_data(USER_DATA_FILE)

        if user_id in users:
            current_balance = users[user_id].get("balance", 0)
            if amount > current_balance:
                self._set_headers(400)
                self._respond({"success": False, "message": "잔액이 부족합니다."})
            else:
                users[user_id]["balance"] -= amount
                save_data(USER_DATA_FILE, users)
                self._set_headers(200)
                self._respond({"success": True, "newBalance": users[user_id]["balance"]})
        else:
            self._set_headers(404)
            self._respond({"success": False, "message": "사용자를 찾을 수 없습니다."})

    def handle_get_favorites(self):
        user_id = self.path.split("userId=")[-1]
        users = load_data(USER_DATA_FILE)
        products = load_data(MARKET_DATA_FILE)

        if user_id in users:
            favorite_ids = users[user_id].get("favorites", [])
            
            favorite_products = {pid: products[pid] for pid in favorite_ids if pid in products}

            self._set_headers()
            self._respond(favorite_products)
        else:
            self._set_headers(404)
            self._respond({"success": False, "message": "User not found"})
    def handle_charge_points(self):
        try:
            length = int(self.headers.get('Content-Length'))
            post_data = json.loads(self.rfile.read(length))
            
            user_id = post_data.get("userId")
            amount = post_data.get("amount")
            
            if not user_id or not isinstance(amount, int) or amount <= 0:
                self._set_headers(400)  
                self._respond({"success": False, "message": "유효하지 않은 요청입니다. 유효한 사용자 ID와 충전 금액을 입력하세요."})
                return

            users = load_data(USER_DATA_FILE)

            if user_id in users:
                users[user_id]["balance"] = users[user_id].get("balance", 0) + amount
                save_data(USER_DATA_FILE, users)  

                self._set_headers(200)
                self._respond({"success": True, "newBalance": users[user_id]["balance"]})
            else:
                self._set_headers(404)
                self._respond({"success": False, "message": "사용자를 찾을 수 없습니다."})
        
        except json.JSONDecodeError:
            self._set_headers(400)
            self._respond({"success": False, "message": "잘못된 JSON 형식입니다."})
        
        except Exception as e:
            print(f"Unexpected error in handle_charge_points: {e}")
            self._set_headers(500)
            self._respond({"success": False, "message": "서버 오류가 발생했습니다. 다시 시도하세요."})

    def handle_user_sales(self):
        user_id = self.path.split("userId=")[-1]
        try:
            products = load_data(MARKET_DATA_FILE)
            user_sales = {pid: prod for pid, prod in products.items() if prod.get("sellerId") == user_id}
            self._set_headers()
            self._respond(user_sales)
        except Exception as e:
            print("Error fetching user sales:", e)
            self._set_headers(500)
            self._respond({"error": "Failed to load user sales."})
    def handle_purchase(self):
        product_id = self.path.split("/")[-1]
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        
        buyer_username = post_data.get("buyer")
        buyer_balance = post_data.get("buyerBalance")
        
        if not buyer_username or buyer_balance is None:
            self._set_headers(400)
            self._respond({"success": False, "message": "유효하지 않은 요청입니다. 구매자 정보가 누락되었습니다."})
            return

        products = load_data(MARKET_DATA_FILE)
        users = load_data(USER_DATA_FILE)

        if product_id in products:
            product = products[product_id]
            product_price = int(product["price"])
            seller_username = product["sellerId"]

            if buyer_balance >= product_price:
                users[buyer_username]["balance"] -= product_price
                users[seller_username]["balance"] = users[seller_username].get("balance", 0) + product_price

                products[product_id]["status"] = "거래 완료"

                save_data(USER_DATA_FILE, users)
                save_data(MARKET_DATA_FILE, products)

                self._set_headers(200)
                self._respond({"success": True, "productPrice": product_price})
            else:
                self._set_headers(400)
                self._respond({"success": False, "message": "잔액이 부족합니다."})
        else:
            self._set_headers(404)
            self._respond({"success": False, "message": "상품을 찾을 수 없습니다."})

    def handle_favorite_product(self):
        length = int(self.headers.get('Content-Length'))
        post_data = json.loads(self.rfile.read(length))
        product_id = post_data.get("productId")
        user_id = post_data.get("userId")

        products = load_data(MARKET_DATA_FILE)
        users = load_data(USER_DATA_FILE)

        if product_id in products and user_id in users:
            products[product_id]["favorites"] = products[product_id].get("favorites", 0) + 1

            if "favorites" not in users[user_id]:
                users[user_id]["favorites"] = []
            if product_id not in users[user_id]["favorites"]:
                users[user_id]["favorites"].append(product_id)

            save_data(MARKET_DATA_FILE, products)
            save_data(USER_DATA_FILE, users)

            self._set_headers()
            self._respond({"success": True, "favorites": products[product_id]["favorites"]})
        else:
            self._set_headers(404)
            self._respond({"success": False, "message": "상품 또는 사용자를 찾을 수 없습니다."})
    def handle_toggle_favorite(self):
        try:
            length = int(self.headers.get('Content-Length'))
            post_data = json.loads(self.rfile.read(length))
            
            product_id = post_data.get("productId")
            user_id = post_data.get("userId")

            products = load_data(MARKET_DATA_FILE)
            users = load_data(USER_DATA_FILE)

            if product_id in products and user_id in users:
                products[product_id].setdefault("favorites", 0)
                users[user_id].setdefault("favorites", [])

                if product_id in users[user_id]["favorites"]:
                    products[product_id]["favorites"] -= 1
                    users[user_id]["favorites"].remove(product_id)
                    favorite_status = False
                else:
                    products[product_id]["favorites"] += 1
                    users[user_id]["favorites"].append(product_id)
                    favorite_status = True

                save_data(MARKET_DATA_FILE, products)
                save_data(USER_DATA_FILE, users)

                self._set_headers()
                self._respond({
                    "success": True,
                    "favorites": products[product_id]["favorites"],
                    "favoriteStatus": favorite_status
                })
            else:
                self._set_headers(404)
                self._respond({"success": False, "message": "Product or user not found"})
        
        except json.JSONDecodeError:
            self._set_headers(400)
            self._respond({"success": False, "message": "잘못된 JSON 형식입니다."})
        
        except Exception as e:
            print(f"Unexpected error in handle_toggle_favorite: {e}")
            self._set_headers(500)
            self._respond({"success": False, "message": "서버 오류가 발생했습니다. 다시 시도하세요."})


def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting httpd server on port {port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
