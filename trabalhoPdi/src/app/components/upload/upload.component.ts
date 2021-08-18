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
  
  constructor(private servico: UploaderService) { }
  
  onChange(arquivo: File){
    if(!arquivo) return;
    this.servico.upload(arquivo).then((resultado)=>{
      this.drawOnCanvas(this.servico.pic);
    });

  }

  drawOnCanvas(pic: Imagem){
    console.log(this.myCanvas);
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
  ngOnInit(): void {
  }
}
