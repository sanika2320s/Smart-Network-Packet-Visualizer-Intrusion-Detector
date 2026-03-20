from flask import Flask, render_template, jsonify
from flask_cors import CORS
import random, time, threading

app = Flask(__name__)
CORS(app)

PACKET_LOG = []
LOG_MAX = 500

def generate_packet():
    src = f"192.168.{random.randint(0,1)}.{random.randint(1,254)}"
    dst = f"10.0.{random.randint(0,3)}.{random.randint(1,254)}"
    size = random.randint(40, 2000)
    proto = random.choice(["TCP","UDP","ICMP"])
    ttl = random.randint(30,255)
    timestamp = time.time()

    is_intrusion = False
    reasons = []
    if size > 1400:
        is_intrusion = True
        reasons.append("Oversized packet")
    if proto == "ICMP" and random.random() < 0.12:
        is_intrusion = True
        reasons.append("ICMP anomaly")
    if src.endswith('.13') or dst.endswith('.13'):
        is_intrusion = True
        reasons.append("Suspicious host .13")

    status = "intrusion" if is_intrusion else "normal"

    packet = {
        "src": src,
        "dst": dst,
        "size": size,
        "proto": proto,
        "ttl": ttl,
        "timestamp": timestamp,
        "status": status,
        "reasons": reasons
    }

    PACKET_LOG.append(packet)
    if len(PACKET_LOG) > LOG_MAX:
        PACKET_LOG.pop(0)
    return packet

def background_generator(interval=0.7):
    while True:
        for _ in range(random.randint(1,6)):
            generate_packet()
        time.sleep(interval)

t = threading.Thread(target=background_generator, daemon=True)
t.start()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/packets')
def api_packets():
    return jsonify(PACKET_LOG[-20:])

@app.route('/api/stats')
def api_stats():
    last = PACKET_LOG[-200:]
    total = len(last)
    intrusions = sum(1 for p in last if p['status']=='intrusion')
    avg_size = (sum(p['size'] for p in last) / total) if total else 0
    by_proto = {}
    for p in last:
        by_proto[p['proto']] = by_proto.get(p['proto'],0)+1
    return jsonify({
        'total': total,
        'intrusions': intrusions,
        'avg_size': avg_size,
        'by_proto': by_proto
    })

if __name__ == '__main__':
    app.run(debug=True)
