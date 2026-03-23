import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tkcjckvqttmnswaktuvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2pja3ZxdHRtbnN3YWt0dXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTE3OTIsImV4cCI6MjA3MTgyNzc5Mn0.Hrzdoue4XSQ1wk93apnRVg_DG0qIfM4hocnjl5yrITM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const container = document.getElementById('items-container');
const gerarBtn = document.getElementById("gerar-resultado");

let selectedItems = [];

function setView(view) {
  container.className = view === 'grid' ? 'grid-view' : 'list-view';
}

function toggleSelect(url, element) {
  if (selectedItems.includes(url)) {
    selectedItems = selectedItems.filter(i => i !== url);
    element.classList.remove('selected');
  } else {
    if (selectedItems.length >= 3) {
      alert("Você só pode escolher até 3 itens.");
      return;
    }
    selectedItems.push(url);
    element.classList.add('selected');
  }
  console.log("Selecionados:", selectedItems);
}

async function loadItens() {
  // lista a pasta "Itens" dentro do bucket
  const { data, error } = await supabase
    .storage
    .from('Itens')
    .list('Itens', { limit: 100 });

  if (error) {
    console.error('Erro ao listar itens:', error);
    return;
  }

  console.log("Arquivos encontrados:", data);

  if (!data || data.length === 0) {
    container.innerHTML = "<p>Nenhum item encontrado no bucket.</p>";
    return;
  }

  for (let file of data) {
    // 👉 ignora qualquer coisa que não seja imagem antes de criar o <img>
    if (!file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      console.log("Ignorando arquivo não imagem:", file.name);
      continue;
    }

    // monta o caminho completo com a pasta
    const filePath = `Itens/${file.name}`;

    const { data: urlData } = supabase
      .storage
      .from('Itens')
      .getPublicUrl(filePath);

    console.log("URL gerada:", urlData.publicUrl);

    const img = document.createElement('img');
    img.src = urlData.publicUrl;
    img.className = "item-img";
    img.onclick = () => toggleSelect(urlData.publicUrl, img);

    container.appendChild(img);
  }
}

function abrirConfirmacao() {
  if (selectedItems.length === 0) {
    alert("Selecione pelo menos 1 item.");
    return;
  }

  const popup = document.getElementById("confirm-popup");
  const thumbs = document.getElementById("thumbs");
  thumbs.innerHTML = "";

  selectedItems.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.className = "thumb-img";
    thumbs.appendChild(img);
  });

  popup.style.display = "flex";
}

function fecharConfirmacao() {
  document.getElementById("confirm-popup").style.display = "none";
}

function confirmarSelecao() {
  localStorage.setItem("selectedItems", JSON.stringify(selectedItems));
  window.location.href = "resultado.html";
}

gerarBtn.addEventListener("click", abrirConfirmacao);

loadItens();

window.fecharConfirmacao = fecharConfirmacao;
window.confirmarSelecao = confirmarSelecao;
window.setView = setView;
