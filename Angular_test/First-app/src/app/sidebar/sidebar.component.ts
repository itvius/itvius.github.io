import { Component, OnInit } from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material';

export interface Section {
	name: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

	column : Section[] = [
		{
			name: 'Item №1',
		},
		{
			name : 'Item №2',
		},
		{
			name: 'Item №3',
		},
		{
			name: 'Item №4',
		}
	]

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon(
        'thumbs-up',
        sanitizer.bypassSecurityTrustResourceUrl('assets/thumbup-icon.svg'));
  }

  ngOnInit() {
  }

}
