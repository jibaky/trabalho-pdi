import { Injectable } from '@angular/core';
import { Imagem, Pixel } from 'src/app/models/imagem.model';
import { resolve } from 'url';

@Injectable({
  providedIn: 'root'
})
export class UploaderService {

  public pic: Imagem = new Imagem();

  constructor() { }

  upload(arquivo: File): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      //if(!['image/x-portable-graymap'].includes(arquivo.type)) reject(false);
      let leitor = new FileReader();
      leitor.onloadend=(e)=>{
        const arrDados = String(leitor.result).split('\n');
        this.pic.tipo = arrDados[0];
        const d = arrDados[1].split(' ');
        let inicioPixels = 3;
        if(d.length == 1) {
          this.pic.largura = Number(arrDados[1]);
          this.pic.altura = Number(arrDados[2]);
          this.pic.valMax = Number(arrDados[3]);
          inicioPixels = 4;
        }
        else{
          this.pic.largura = Number(d[0]);
          this.pic.altura = Number(d[1]);
          this.pic.valMax = Number(arrDados[2]);
        }
        if(this.pic.tipo == 'P2') this.pic.pixels = this.loadPGM(arrDados, inicioPixels);
        if(this.pic.tipo == 'P3') this.pic.pixels = this.loadPPM(arrDados, inicioPixels);
        console.log('resultado', this.pic);
        resolve(true);
      };
      leitor.readAsText(arquivo);

    });
  }
  private loadPGM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i++){
      pixels.push(new Pixel(Number(dados[i])));
    }
    return pixels;
  }
  private loadPPM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i=i+3){
      pixels.push(new Pixel(Number(dados[i]), Number(dados[i+1]), Number(dados[i+2])));
    }
    return pixels;
  }
  negativo(): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      if(!this.pic.tipo) resolve(false);
      for(let i = 0; i<this.pic.pixels.length; i++){
        this.pic.pixels[i].r = this.pic.valMax-this.pic.pixels[i].r;
        this.pic.pixels[i].g = this.pic.valMax-this.pic.pixels[i].g;
        this.pic.pixels[i].b = this.pic.valMax-this.pic.pixels[i].b;
      }
      resolve(true);
    })
  }
}