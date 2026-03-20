const flowCanvas = document.getElementById('flow-canvas');
const packetList = document.getElementById('packetList');
const totalEl = document.getElementById('total');
const intrusionsEl = document.getElementById('intrusions');
const avgsizeEl = document.getElementById('avgsize');

let protoChart, sizeChart;

async function fetchData(){
  try{
    const [pRes, sRes] = await Promise.all([fetch('/api/packets'), fetch('/api/stats')]);
    const packets = await pRes.json();
    const stats = await sRes.json();
    renderFlow(packets);
    renderList(packets);
    renderStats(stats);
    renderSizeChart(packets);
  }catch(e){console.error(e)}
}

function renderFlow(packets){
  flowCanvas.innerHTML = '';
  packets.forEach((p,i)=>{
    const el = document.createElement('div');
    el.className = 'packet '+p.status;
    el.style.position = 'absolute';
    el.style.left = (4 + i*9) + '%';
    el.style.top = (8 + (i%6)*12) + '%';
    el.style.width = 'auto';
    el.style.padding = '8px 12px';
    el.style.transition = 'transform 1.2s ease, opacity 1.2s ease';
    el.innerHTML = `<div><strong>${p.src}</strong> ➜ <strong>${p.dst}</strong></div><div class='meta'>${p.proto} • ${p.size} B</div>`;
    flowCanvas.appendChild(el);
    setTimeout(()=> el.style.transform = 'translateX(18px) translateY(-8px)', 60+i*25);
    setTimeout(()=> el.style.opacity = '0.96', 80+i*25);
  })
}

function renderList(packets){
  packetList.innerHTML = '';
  packets.slice().reverse().forEach(p=>{
    const d = document.createElement('div');
    d.className = 'packet '+p.status;
    d.innerHTML = `<div><strong>${p.src}</strong> ➜ <strong>${p.dst}</strong></div><div class='meta'>${p.proto} • ${p.size} B • ${p.reasons? p.reasons.join(', '):''}</div>`;
    packetList.appendChild(d);
  })
}

function renderStats(stats){
  totalEl.innerText = stats.total;
  intrusionsEl.innerText = stats.intrusions;
  avgsizeEl.innerText = Math.round(stats.avg_size);

  const labels = Object.keys(stats.by_proto);
  const data = Object.values(stats.by_proto);
  if(!protoChart){
    const ctx = document.getElementById('protoChart').getContext('2d');
    protoChart = new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data }] },
      options: { plugins:{legend:{position:'bottom'} }}
    });
  }else{
    protoChart.data.labels = labels;
    protoChart.data.datasets[0].data = data;
    protoChart.update();
  }
}

function renderSizeChart(packets){
  const labels = packets.map((p,i)=> i+1);
  const data = packets.map(p=> p.size);
  if(!sizeChart){
    const ctx = document.getElementById('sizeChart').getContext('2d');
    sizeChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Packet size (B)', data, fill:false, tension:0.3 }] },
      options: { scales:{ y:{ beginAtZero:true } }, plugins:{legend:{display:false}} }
    });
  }else{
    sizeChart.data.labels = labels;
    sizeChart.data.datasets[0].data = data;
    sizeChart.update();
  }
}

fetchData();
setInterval(fetchData, 1200);
