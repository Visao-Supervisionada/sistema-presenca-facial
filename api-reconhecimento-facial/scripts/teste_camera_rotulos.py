import time
import cv2
import requests


API_URL = "http://localhost:8000/recognize-multiple"
THRESHOLD = 0.60
REQUEST_INTERVAL_SECONDS = 0.7  # intervalo entre chamadas à API


def main():
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Não foi possível abrir a webcam.")
        return

    print("Webcam aberta.")
    print("Reconhecimento em tempo real iniciado.")
    print("Pressione Q para sair.")

    last_request_time = 0.0
    last_results = []

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Erro ao capturar frame.")
            break

        current_time = time.time()

        # chama a API periodicamente
        if current_time - last_request_time >= REQUEST_INTERVAL_SECONDS:
            success, encoded_image = cv2.imencode(".jpg", frame)

            if success:
                files = {
                    "file": ("frame.jpg", encoded_image.tobytes(), "image/jpeg")
                }
                data = {
                    "threshold": str(THRESHOLD)
                }

                try:
                    response = requests.post(API_URL, files=files, data=data, timeout=30)

                    if response.status_code == 200:
                        result = response.json()
                        last_results = result.get("results", [])
                    else:
                        print("Erro na API:", response.status_code, response.text)

                except Exception as e:
                    print(f"Erro ao chamar API: {e}")

            last_request_time = current_time

        # desenhar o último resultado conhecido
        for item in last_results:
            x1, y1, x2, y2 = item["bbox"]
            matched = item["matched"]
            name = item["name"]
            confidence = item["confidence"]

            color = (0, 255, 0) if matched else (0, 0, 255)
            label = f"{name} ({confidence:.2f})"

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            text_y = y1 - 10 if y1 - 10 > 20 else y1 + 25
            cv2.putText(
                frame,
                label,
                (x1, text_y),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2,
                cv2.LINE_AA,
            )

        cv2.imshow("Reconhecimento Facial em Tempo Real", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()