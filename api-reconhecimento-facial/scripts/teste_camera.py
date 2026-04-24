import cv2
import requests


API_URL = "http://localhost:8000/recognize"
THRESHOLD = "0.60"


def enviar_frame(frame):
    sucesso, buffer = cv2.imencode(".jpg", frame)

    if not sucesso:
        print("Erro ao converter frame para JPG.")
        return

    files = {
        "file": ("frame.jpg", buffer.tobytes(), "image/jpeg")
    }

    data = {
        "threshold": THRESHOLD
    }

    try:
        response = requests.post(API_URL, files=files, data=data, timeout=10)
        print(response.status_code)
        print(response.json())
    except Exception as erro:
        print("Erro ao chamar API:", erro)


def main():
    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("Não consegui abrir a webcam.")
        return

    print("Webcam aberta.")
    print("Pressione R para reconhecer.")
    print("Pressione Q para sair.")

    while True:
        ret, frame = camera.read()

        if not ret:
            print("Erro ao capturar frame.")
            break

        cv2.imshow("Teste Webcam - R reconhece / Q sai", frame)

        tecla = cv2.waitKey(1) & 0xFF

        if tecla == ord("r"):
            enviar_frame(frame)

        if tecla == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()