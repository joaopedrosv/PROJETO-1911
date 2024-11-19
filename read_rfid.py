import serial
import requests

# Configure a porta serial e a taxa de transmissão
ser = serial.Serial('COM4', 9600)  # Substitua 'COM4' pela porta correta

def enviar_para_servidor(uid):
    url = 'http://localhost:3000/verificar-uid/'
    response = requests.post(url, json={'uid': uid})
    print(response.text)

while True:
    if ser.in_waiting > 0:
        linha = ser.readline().decode('utf-8').strip()
        if linha.startswith("UID RFID:"):
            uid = linha.replace("UID RFID:", "").strip()
            if uid:
                print(f"Enviando UID: {uid}")
                enviar_para_servidor(uid)
