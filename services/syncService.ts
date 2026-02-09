
const CLOUD_API = 'https://api.npoint.io/';

export const syncToCloud = async (teamCode: string, data: any) => {
  if (!teamCode || teamCode === 'local') return null;
  
  try {
    const response = await fetch(`${CLOUD_API}${teamCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.ok;
  } catch (error) {
    console.error("Erro ao sincronizar com a nuvem:", error);
    return false;
  }
};

export const fetchFromCloud = async (teamCode: string) => {
  if (!teamCode || teamCode === 'local') return null;
  
  try {
    const response = await fetch(`${CLOUD_API}${teamCode}`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Erro ao procurar dados na nuvem:", error);
    return null;
  }
};

// Gera um ID único para a equipa caso não exista
export const generateTeamCode = () => {
  return `pixelar-${Math.random().toString(36).substring(2, 15)}`;
};
