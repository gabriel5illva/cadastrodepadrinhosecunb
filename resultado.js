import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tkcjckvqttmnswaktuvk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY2pja3ZxdHRtbnN3YWt0dXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTE3OTIsImV4cCI6MjA3MTgyNzc5Mn0.Hrzdoue4XSQ1wk93apnRVg_DG0qIfM4hocnjl5yrITM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

document.addEventListener('DOMContentLoaded', async () => {
  const selectedItems = JSON.parse(localStorage.getItem('selectedItems')) || [];

  const resultadoDiv = document.getElementById("resultado");

  if (selectedItems.length === 0) {
    resultadoDiv.innerHTML = `
      <p>Nenhum item selecionado.</p>
      <p><strong>Bem-vind@, calour@ apadrinhad@!</strong></p>
    `;
    resultadoDiv.style.display = "block";
    return;
  }

  const padrinhosUnicos = new Map();

  // Buscar todos os padrinhos
  const { data: todosPadrinhos, error } = await supabase
    .from('padrinhos')
    .select('matricula, nome, telefone, foto_perfil, fotos_itens');

  if (error) {
    console.error("Erro ao buscar padrinhos:", error);
    resultadoDiv.innerHTML = "<p>Erro ao carregar os padrinhos.</p>";
    return;
  }

  // Comparar cada item selecionado com fotos_itens
  for (let url of selectedItems) {
    todosPadrinhos.forEach(p => {
      if (Array.isArray(p.fotos_itens)) {
        const fotosValidas = p.fotos_itens.filter(f => f !== null);

        if (fotosValidas.includes(url)) {
          if (!padrinhosUnicos.has(p.matricula)) {
            padrinhosUnicos.set(p.matricula, p);
          }
        }
      }
    });
  }

  const encontrados = [...padrinhosUnicos.values()];

  // Exibir no DOM
  exibirResultado(encontrados, selectedItems);

  // Salvar no Supabase
  await salvarResultado(encontrados);
});

function exibirResultado(padrinhos, itensSelecionados) {
  const resultadoDiv = document.getElementById('resultado');

  if (padrinhos.length === 0) {
    resultadoDiv.innerHTML = `
      <p>Nenhum padrinho encontrado.</p>
      <p><strong>Bem-vind@, calour@ apadrinhad@!</strong></p>
    `;
  } else {
    resultadoDiv.innerHTML = `
      <h2>Você combina com:</h2>
      ${padrinhos.map(p => `
        <div class="resultado-container">
          <img src="${p.foto_perfil}" alt="${p.nome}" class="torneira-imagem">
          <h3><strong>${p.nome}</strong></h3>
          <p><a href="https://wa.me/55${p.telefone.replace(/\D/g, '')}" target="_blank">
          ${p.telefone}
          </a></p>
        </div>
      `).join('')}
      <div class="resultado-container">
        <h4>Itens escolhidos:</h4>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          ${itensSelecionados.map(url => `
            <img src="${url}" class="thumb-img" alt="Item escolhido">
          `).join('')}
        </div>
      </div>
    `;
  }

  resultadoDiv.style.display = 'block';
}

async function salvarResultado(padrinhos) {
  const nome = localStorage.getItem("nome") || "Anônimo";
  const matricula = localStorage.getItem("matricula") || "000000000";

  // lista só os nomes dos padrinhos encontrados
  const nomesPadrinhos = padrinhos.map(p => p.nome);

  try {
    const { error } = await supabase
      .from("resultados")
      .insert([{
        nome,
        matricula,
        padrinhos: nomesPadrinhos
      }]);

    if (error) {
      console.error("Erro ao salvar resultado:", error);
    } else {
      console.log("Resultado salvo com sucesso!");
    }
  } catch (err) {
    console.error("Erro inesperado ao salvar:", err);
  }
}