// navigation/types.ts
export type RootStackParamList = {
  Login: undefined;
  HomeScreen: undefined;
  TrabajoDiario: undefined;
  Planteles: {
    team: string;
    partidoId: number;
    torneoId: number;
  };
 Goles: {
    team: string;
    partidoId: number;
    torneoId: number;
  };
};