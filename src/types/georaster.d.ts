declare module "georaster" {
  interface Georaster {
    width: number;
    height: number;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
    noDataValue: number | null;
    values: number[][][];
  }
  export default function parseGeoraster(input: ArrayBuffer | string): Promise<Georaster>;
}
