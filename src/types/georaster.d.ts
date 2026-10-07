declare module "georaster" {
  interface Georaster {
    projection: number | string;
    getValues(options: { left: number; top: number; right: number; bottom: number; width: number; height: number; resampleMethod: "nearest" | "bilinear" }): Promise<number[][][]>;
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
