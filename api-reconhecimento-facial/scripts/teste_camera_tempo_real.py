import time
import cv2
import requests


API_URL = "http://localhost:8000/recognize-multiple"

THRESHOLD = 0.60
MIN_COSINE_THRESHOLD = 0.35
REQUEST_INTERVAL_SECONDS = 0.3

FRAME_ENVIO_LARGURA = 640
FRAME_ENVIO_ALTURA = 360

CONFIRMACOES_NECESSARIAS = 3


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

    ultimo_nome = None
    contador_nome = 0
    nome_confirmado = None

    while True:
        ret, frame = cap.read()

        if not ret:
            print("Erro ao capturar frame.")
            break

        altura_original, largura_original = frame.shape[:2]
        current_time = time.time()

        if current_time - last_request_time >= REQUEST_INTERVAL_SECONDS:
            frame_envio = cv2.resize(
                frame,
                (FRAME_ENVIO_LARGURA, FRAME_ENVIO_ALTURA),
            )

            success, encoded_image = cv2.imencode(
                ".jpg",
                frame_envio,
                [int(cv2.IMWRITE_JPEG_QUALITY), 70],
            )

            if success:
                files = {
                    "file": ("frame.jpg", encoded_image.tobytes(), "image/jpeg"),
                }

                data = {
                    "threshold": str(THRESHOLD),
                    "min_cosine_threshold": str(MIN_COSINE_THRESHOLD),
                }

                try:
                    response = requests.post(
                        API_URL,
                        files=files,
                        data=data,
                        timeout=10,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        last_results = result.get("results", [])

                        melhor_match = None

                        for item in last_results:
                            if item.get("matched"):
                                melhor_match = item
                                break

                        if melhor_match:
                            nome_atual = melhor_match["name"]

                            if nome_atual == ultimo_nome:
                                contador_nome += 1
                            else:
                                ultimo_nome = nome_atual
                                contador_nome = 1

                            if contador_nome >= CONFIRMACOES_NECESSARIAS:
                                nome_confirmado = nome_atual
                        else:
                            ultimo_nome = None
                            contador_nome = 0
                            nome_confirmado = None

                    else:
                        print("Erro na API:", response.status_code, response.text)

                except Exception as erro:
                    print(f"Erro ao chamar API: {erro}")

            last_request_time = current_time

        escala_x = largura_original / FRAME_ENVIO_LARGURA
        escala_y = altura_original / FRAME_ENVIO_ALTURA

        for item in last_results:
            x1, y1, x2, y2 = item["bbox"]

            x1 = int(x1 * escala_x)
            y1 = int(y1 * escala_y)
            x2 = int(x2 * escala_x)
            y2 = int(y2 * escala_y)

            matched = item["matched"]
            name = item["name"]
            confidence = item["confidence"]
            cosine_confidence = item.get("cosine_confidence", 0.0)

            color = (0, 255, 0) if matched else (0, 0, 255)

            if nome_confirmado == name:
                label = f"confirmado: {name}"
            else:
                label = f"{name} ({confidence:.2f} | cos {cosine_confidence:.2f})"

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