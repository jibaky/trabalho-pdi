import { Injectable } from '@angular/core';
import { Imagem, Pixel } from 'src/app/models/imagem.model';

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
        //console.log(this.pic.pixels);
        resolve(true);
      };
      leitor.readAsText(arquivo);

    });
  }
  private loadPGM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i++){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i])));
    }
    return pixels;
  }
  private loadPPM(dados: Array<String>, offset: number): Pixel[]{
    const pixels=[];
    for(let i = offset; i<dados.length; i=i+3){
      if(dados[i]!=="")pixels.push(new Pixel(Number(dados[i]), Number(dados[i+1]), Number(dados[i+2])));
    }
    return pixels;
  }
  getHistograma(){
    let freq = {};
    for(let i=0; i <this.pic.pixels.length; i++){
      if(freq[this.pic.pixels[i].r]===undefined){
        freq[this.pic.pixels[i].r]=1;
      } else freq[this.pic.pixels[i].r] = freq[this.pic.pixels[i].r]+1;
    }
    return freq;
  }
  getFreqAcc(freq){
    let tam = Object.keys(freq);
    let fAcc = {};
    for(let i=0; i<tam.length; i++){
      if(i==0) fAcc[tam[i]] = freq[tam[i]];
      else fAcc[tam[i]] = freq[tam[i]] + fAcc[tam[i-1]];
    }
    return fAcc;
  }
  eqFreq(){
    if(this.pic.tipo == 'P3') return;
    let freq = this.getHistograma();
    let fAcc = this.getFreqAcc(freq);
    let tam = Object.keys(freq);
    let nCinza = this.pic.valMax, nCol = this.pic.largura, nLin = this.pic.altura;
    let fEq = {};
    for(let i=0; i<tam.length; i++) fEq[tam[i]] = Math.max(0,Math.round((nCinza*fAcc[tam[i]])/(nCol*nLin))-1);
    return fEq;
  }
  equalizarHistograma(fEq): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
      for(let i=0; i<this.pic.pixels.length; i++){
        this.pic.pixels[i].r = fEq[this.pic.pixels[i].r];
        this.pic.pixels[i].g = fEq[this.pic.pixels[i].g];
        this.pic.pixels[i].b = fEq[this.pic.pixels[i].b];
      }
      //console.log(this.pic.pixels);
      resolve(true);
    });
  }
  saltPepper(qtd): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      qtd = Math.round(qtd*this.pic.pixels.length);
      for(let i=0; i<qtd; i++){
        let x = Math.floor(Math.random()*(this.pic.largura - 0)+0);
        let y = Math.floor(Math.random()*(this.pic.altura - 0)+0);
        let cor = Math.round(Math.random());
        if (cor == 1) cor = 255;
        let index = y*this.pic.largura+x;
        //console.log(x,y,this.pic.largura,index, this.pic.pixels[index]);
        this.pic.pixels[index].r = cor;
        this.pic.pixels[index].g = cor;
        this.pic.pixels[index].b = cor;
      }
      resolve(true);
    });
  }
  negativo(): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      if(!this.pic.tipo) resolve(false);
      for(let i = 0; i<this.pic.pixels.length; i++){
        this.pic.pixels[i].r = this.pic.valMax-this.pic.pixels[i].r;
        this.pic.pixels[i].g = this.pic.valMax-this.pic.pixels[i].g;
        this.pic.pixels[i].b = this.pic.valMax-this.pic.pixels[i].b;
      }
      //console.log(this.pic.pixels);
      resolve(true);
    });
  }
  lowPass(): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
      let mask = [0,0,0,0,0,0,0,0,0];
      let fator = 9, largura = this.pic.largura, altura = this.pic.altura;
      for(let i=0; i<altura; i++){
        for(let j=0; j<largura; j++){
          let index = i*largura+j;
          //console.log(index);
          if(index == 0){//canto superior esquerdo
            //console.log('teste1', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+0);
            mask[0] = this.pic.pixels[index].r;
            mask[1] = this.pic.pixels[index].r;
            mask[2] = this.pic.pixels[index+1].r;
            mask[3] = this.pic.pixels[index].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index+1].r;
            mask[6] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[7] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste1F');
          }
          else if(index == largura-1){//canto superior direito
            //console.log('teste2','index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(largura-1));
            mask[0] = this.pic.pixels[index-1].r
            mask[1] = this.pic.pixels[index].r;
            mask[2] = this.pic.pixels[index].r;
            mask[3] = this.pic.pixels[index-1].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index].r;
            mask[6] = this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = this.pic.pixels[(i+1)*largura+(j)].r;
            //console.log('teste2F');
          }
          else if(index == (altura-1)*largura){//canto inferior esquerdo
            //console.log('teste3', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura-1)*largura);
            mask[0] = this.pic.pixels[(i-1)*largura+(j)].r
            mask[1] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = this.pic.pixels[index].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index+1].r;
            mask[6] = this.pic.pixels[index].r;
            mask[7] = this.pic.pixels[index].r;
            mask[8] = this.pic.pixels[index+1].r;
            //console.log('teste3F');
          }
          else if(index == altura*largura-1){//canto inferior direito
            //console.log('teste4', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura*largura-1));
            mask[0] = this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[3] = this.pic.pixels[index-1].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index].r;
            mask[6] = this.pic.pixels[index-1].r;
            mask[7] = this.pic.pixels[index].r;
            mask[8] = this.pic.pixels[index].r;
            //console.log('teste4F');
          }
          else if(index == i*largura){//borda esquerda
            //console.log('teste5', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(i*largura));
            mask[0] = this.pic.pixels[(i-1)*largura+(j)].r
            mask[1] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = this.pic.pixels[index].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index+1].r;
            mask[6] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[7] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste5F');
          }
          else if(index == (i+1)*largura-1){//borda direita
            //console.log('teste6', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+((i+1)*largura-1));
            mask[0] = this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[3] = this.pic.pixels[index-1].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index].r;
            mask[6] = this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = this.pic.pixels[(i+1)*largura+(j)].r;
            //console.log('teste6F');
          }
          else if(index < largura){//borda cima
            //console.log('teste7', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '<'+largura);
            mask[0] = this.pic.pixels[index-1].r
            mask[1] = this.pic.pixels[index].r;
            mask[2] = this.pic.pixels[index+1].r;
            mask[3] = this.pic.pixels[index-1].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index+1].r;
            mask[6] = this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste7F');
          }
          else if(index > (altura-1)*largura){//borda baixo
            //console.log('teste8', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '>'+(altura-1)*largura);
            mask[0] = this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = this.pic.pixels[(i-1)*largura+j].r;
            mask[2] = this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = this.pic.pixels[index-1].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index+1].r;
            mask[6] = this.pic.pixels[index-1].r;
            mask[7] = this.pic.pixels[index].r;
            mask[8] = this.pic.pixels[index+1].r;
            //console.log('teste8F');
          }
          else{
            //console.log('teste9', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura);
            mask[0] = this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = this.pic.pixels[index-1].r;
            mask[4] = this.pic.pixels[index].r;
            mask[5] = this.pic.pixels[index+1].r;
            mask[6] = this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste9F');
          }
          let value=0;
          for(let aux = 0; aux<9; aux++) value+=mask[aux];
          this.pic.pixels[index].r = Math.round(value/fator);
          this.pic.pixels[index].g = Math.round(value/fator);
          this.pic.pixels[index].b = Math.round(value/fator);
        }
      }
      resolve(true);
    });
  }
  highPass(): Promise<boolean>{
    return new Promise((resolve, reject)=>{
      if(this.pic.tipo == 'P3') return alert("Essa feature so foi implementada para imagens .pgm");
      let mask = [0,0,0,0,0,0,0,0,0];
      let fator = 9, largura = this.pic.largura, altura = this.pic.altura;
      for(let i=0; i<altura; i++){
        for(let j=0; j<largura; j++){
          let index = i*largura+j;
          //console.log(index);
          if(index == 0){//canto superior esquerdo
            //console.log('teste1', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+0);
            mask[0] = -1 * this.pic.pixels[index].r;
            mask[1] = -1 * this.pic.pixels[index].r;
            mask[2] = -1 * this.pic.pixels[index+1].r;
            mask[3] = -1 * this.pic.pixels[index].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index+1].r;
            mask[6] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[7] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = -1 * this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste1F');
          }
          else if(index == largura-1){//canto superior direito
            //console.log('teste2','index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(largura-1));
            mask[0] = -1 * this.pic.pixels[index-1].r
            mask[1] = -1 * this.pic.pixels[index].r;
            mask[2] = -1 * this.pic.pixels[index].r;
            mask[3] = -1 * this.pic.pixels[index-1].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index].r;
            mask[6] = -1 * this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            //console.log('teste2F');
          }
          else if(index == (altura-1)*largura){//canto inferior esquerdo
            //console.log('teste3', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura-1)*largura);
            mask[0] = -1 * this.pic.pixels[(i-1)*largura+(j)].r
            mask[1] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = -1 * this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = -1 * this.pic.pixels[index].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index+1].r;
            mask[6] = -1 * this.pic.pixels[index].r;
            mask[7] = -1 * this.pic.pixels[index].r;
            mask[8] = -1 * this.pic.pixels[index+1].r;
            //console.log('teste3F');
          }
          else if(index == altura*largura-1){//canto inferior direito
            //console.log('teste4', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(altura*largura-1));
            mask[0] = -1 * this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[3] = -1 * this.pic.pixels[index-1].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index].r;
            mask[6] = -1 * this.pic.pixels[index-1].r;
            mask[7] = -1 * this.pic.pixels[index].r;
            mask[8] = -1 * this.pic.pixels[index].r;
            //console.log('teste4F');
          }
          else if(index == i*largura){//borda esquerda
            //console.log('teste5', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+(i*largura));
            mask[0] = -1 * this.pic.pixels[(i-1)*largura+(j)].r
            mask[1] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = -1 * this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = -1 * this.pic.pixels[index].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index+1].r;
            mask[6] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[7] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = -1 * this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste5F');
          }
          else if(index == (i+1)*largura-1){//borda direita
            //console.log('teste6', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '='+((i+1)*largura-1));
            mask[0] = -1 * this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[3] = -1 * this.pic.pixels[index-1].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index].r;
            mask[6] = -1 * this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            //console.log('teste6F');
          }
          else if(index < largura){//borda cima
            //console.log('teste7', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '<'+largura);
            mask[0] = -1 * this.pic.pixels[index-1].r
            mask[1] = -1 * this.pic.pixels[index].r;
            mask[2] = -1 * this.pic.pixels[index+1].r;
            mask[3] = -1 * this.pic.pixels[index-1].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index+1].r;
            mask[6] = -1 * this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = -1 * this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste7F');
          }
          else if(index > (altura-1)*largura){//borda baixo
            //console.log('teste8', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura, '>'+(altura-1)*largura);
            mask[0] = -1 * this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = -1 * this.pic.pixels[(i-1)*largura+j].r;
            mask[2] = -1 * this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = -1 * this.pic.pixels[index-1].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index+1].r;
            mask[6] = -1 * this.pic.pixels[index-1].r;
            mask[7] = -1 * this.pic.pixels[index].r;
            mask[8] = -1 * this.pic.pixels[index+1].r;
            //console.log('teste8F');
          }
          else{
            //console.log('teste9', 'index='+index, 'i='+i, 'j='+j, 'largura='+largura);
            mask[0] = -1 * this.pic.pixels[(i-1)*largura+(j-1)].r
            mask[1] = -1 * this.pic.pixels[(i-1)*largura+(j)].r;
            mask[2] = -1 * this.pic.pixels[(i-1)*largura+(j+1)].r;
            mask[3] = -1 * this.pic.pixels[index-1].r;
            mask[4] =  8 * this.pic.pixels[index].r;
            mask[5] = -1 * this.pic.pixels[index+1].r;
            mask[6] = -1 * this.pic.pixels[(i+1)*largura+(j-1)].r;
            mask[7] = -1 * this.pic.pixels[(i+1)*largura+(j)].r;
            mask[8] = -1 * this.pic.pixels[(i+1)*largura+(j+1)].r;
            //console.log('teste9F');
          }
          let value=0;
          for(let aux = 0; aux<9; aux++) value+=mask[aux];
          //console.log(index, Math.round(value/fator));
          this.pic.pixels[index].r = Math.round(value/fator);
          this.pic.pixels[index].g = Math.round(value/fator);
          this.pic.pixels[index].b = Math.round(value/fator);
        }
      }
      resolve(true);
    });
  }
}