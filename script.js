import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://tkcjckvqttmnswaktuvk.supabase.co';
const supabaseAnonKey = 'SUA_ANON_KEY_AQUI';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const form = document.getElementById('form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const matricula = document.getElementById('matricula').value.trim();
  const telefone = document.getElementById('telefone').value.trim();
  const fotoPerfil = document.getElementById('fotoPerfil').files[0];
  const fotosItens = Array.from(document.getElementById('fotosItens').files);

  if (!nome || !matricula || !telefone) {
    alert('Preencha todos os campos obrigatórios.');
    return;
  }

  if (!fotoPerfil) {
    alert('Envie uma foto de perfil.');
    return;
  }

  if (fotosItens.length < 1 || fotosItens.length > 2) {
    alert('Envie no mínimo 1 e no máximo 2 imagens de objetos.');
    return;
  }

  let perfilPath = null;
  const itensPaths = [];

  try {
    // 1) Upload da foto de perfil
    perfilPath = `Padrinhos/${matricula}_perfil_${Date.now()}_${fotoPerfil.name}`;

    const { error: errPerfil } = await supabase.storage
      .from('Padrinhos')
      .upload(perfilPath, fotoPerfil, { upsert: true });

    if (errPerfil) throw errPerfil;

    const { data: perfilData } = supabase.storage
      .from('Padrinhos')
      .getPublicUrl(perfilPath);

    const fotoPerfilUrl = perfilData.publicUrl;

    // 2) Upload das fotos dos itens
    const fotosItensUrls = [];

    for (let i = 0; i < fotosItens.length; i++) {
      const arquivo = fotosItens[i];
      const itemPath = `Itens/${matricula}_item${i + 1}_${Date.now()}_${arquivo.name}`;

      const { error: errItem } = await supabase.storage
        .from('Itens')
        .upload(itemPath, arquivo, { upsert: true });

      if (errItem) throw errItem;

      itensPaths.push(itemPath);

      const { data: itemData } = supabase.storage
        .from('Itens')
        .getPublicUrl(itemPath);

      fotosItensUrls.push(itemData.publicUrl);
    }

    // 3) Inserir no banco
    const { error: insertError } = await supabase
      .from('padrinhos')
      .insert([
        {
          nome,
          matricula,
          telefone,
          foto_perfil: fotoPerfilUrl,
          fotos_itens: fotosItensUrls
        }
      ]);

    if (insertError) throw insertError;

    // 4) Verificar buscando de volta
    const { data: padrinhoSalvo, error: selectError } = await supabase
      .from('padrinhos')
      .select('nome, matricula, telefone, foto_perfil, fotos_itens')
      .eq('matricula', matricula)
      .single();

    if (selectError) throw new Error('Não foi possível verificar o cadastro salvo.');

    const dadosConferem =
      padrinhoSalvo.nome === nome &&
      padrinhoSalvo.matricula === matricula &&
      padrinhoSalvo.telefone === telefone &&
      padrinhoSalvo.foto_perfil === fotoPerfilUrl &&
      Array.isArray(padrinhoSalvo.fotos_itens) &&
      padrinhoSalvo.fotos_itens.length === fotosItensUrls.length &&
      fotosItensUrls.every(url => padrinhoSalvo.fotos_itens.includes(url));

    if (!dadosConferem) {
      throw new Error('Os dados salvos não conferem com o upload realizado.');
    }

    alert('Cadastro realizado com sucesso!');
    form.reset();

  } catch (error) {
    console.error('Erro no cadastro:', error);

    // apaga imagens do bucket se não salvar o cadastro
    try {
      if (perfilPath) {
        await supabase.storage.from('Padrinhos').remove([perfilPath]);
      }

      if (itensPaths.length > 0) {
        await supabase.storage.from('Itens').remove(itensPaths);
      }
    } catch (rollbackError) {
      console.error('Erro ao fazer rollback dos arquivos:', rollbackError);
    }

    alert('Falha no cadastro. Os arquivos enviados foram revertidos. Veja o console para mais detalhes.');
  }
});
