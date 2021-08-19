import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Imagem } from 'src/app/models/imagem.model';
import { UploaderService } from 'src/app/services/uploader/uploader.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {

  @ViewChild('draw') myCanvas: ElementRef;
  textoR: any = 0;
  textoG: any = 0;
  textoB: any = 0;
  textoH: any = 0;
  textoS: any = 0;
  textoL: any = 0;

  constructor(private servico: UploaderService) { }
  
  onChange(arquivo: File){
    if(!arquivo) return;
    this.servico.upload(arquivo).then((resultado)=>{
      this.drawOnCanvas(this.servico.pic);
    });

  }

  drawOnCanvas(pic: Imagem){
    //console.log(this.myCanvas);
    const context = this.myCanvas.nativeElement.getContext('2d');
    this.myCanvas.nativeElement.width = pic.largura;
    this.myCanvas.nativeElement.height = pic.altura;
    for(let i = 0; i<pic.pixels.length; i++){
      context.fillStyle = `rgb(${pic.pixels[i].r}, ${pic.pixels[i].g}, ${pic.pixels[i].b})`;
      context.fillRect(i%pic.largura, Math.floor(i/pic.largura), 1, 1);
    }
  }
  negativo(){
    this.servico.negativo().then((resultado)=>{
      this.drawOnCanvas(this.servico.pic);
    });
  }
  eqFreq(){
    let fEq = this.servico.eqFreq();
  }
  equalizarHistograma(){
    this.servico.equalizarHistograma(this.servico.eqFreq()).then((resultado)=>{
      this.drawOnCanvas(this.servico.pic);
    });
  }
  saltPepper(qtd){
    this.servico.saltPepper(qtd/100).then((resultado)=>{
      this.drawOnCanvas(this.servico.pic);
    });
  }
  lowPass(){
    this.servico.lowPass().then((resultado)=>{
      this.drawOnCanvas(this.servico.pic);
    })
  }
  getMousePosition(event){
    const ctx = this.myCanvas.nativeElement.getContext('2d');
    let rect = this.myCanvas.nativeElement.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    var ImageData = ctx.getImageData(x, y, 1, 1);
    //console.log(ImageData);
    var hsl = this.RGBtoHSL(ImageData.data[0], ImageData.data[1], ImageData.data[2]);
    this.textoR = ImageData.data[0];
    this.textoG = ImageData.data[1];
    this.textoB = ImageData.data[2];
    this.textoH = hsl[0];
    this.textoS = hsl[1];
    this.textoL = hsl[2];
  }
  RGBtoHSL(r,g,b){
    r/=255, g/=255, b/=255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax-cmin,
        h=0, s=0, l=0;
    
    if(delta == 0) h=0;
    else if(cmax == r) h = ((g - b) / delta) % 6;
    else if(cmax == g) h = (b - r) / delta + 2;
    else  h = (r - g) / delta + 4;
    h = Math.round(h*40);
    if( h < 0 ) h+=240;

    l = (cmax+cmin)/2;

    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = +(s * 240).toFixed(1);
    l = +(l * 240).toFixed(1);

    return [h,s,l]
  }
  ngOnInit(): void {
  }
  ngAfterViewInit(): void{
    this.myCanvas.nativeElement.addEventListener("mousedown", (e)=>{
      this.getMousePosition(e);
  })
  }
}
