import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';  // CORRIGÉ : import du DashboardComponent

describe('DashboardComponent', () => {  // CORRIGÉ : nom du describe
  let component: DashboardComponent;    // CORRIGÉ : type DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>;  // CORRIGÉ : type

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent]  // CORRIGÉ : utiliser DashboardComponent (standalone)
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);  // CORRIGÉ : créer DashboardComponent
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});