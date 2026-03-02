import { CommonModule } from '@angular/common';
import { Component, Pipe, PipeTransform, signal, computed, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

const orcaAddress = 'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE';

async function getPriceByPoolAddress(address: string): Promise<number> {
  const result = await fetch(`https://api.orca.so/v2/solana/pools/${address}`);
  const { data } = await result.json()
  const multiple = data.price * 1000;
  return Math.round(multiple) / 1000;
}


@Pipe({
  pure: false,
  name: 'computeSolToInvest'
})
export class ComputeSolToInvestPipe implements PipeTransform {
  transform(inputToInvest: InputToInvest) {
    const var_VP = Math.sqrt(inputToInvest.current);
    const var_VPu = Math.sqrt(inputToInvest.rangeMax);
    const var_VPl = Math.sqrt(inputToInvest.rangeMin);;

    const var_Denominator = (1/var_VP - 1/var_VPu) * inputToInvest.current + (var_VP - var_VPl);
    const var_L = inputToInvest.investAmount / var_Denominator;
    
    const resultSolToInvestInSol = var_L * (1/var_VP - 1/var_VPu);
    const resultSolToInvestInDollar = resultSolToInvestInSol * inputToInvest.current;
    const resultDollarToInvestInDollar = inputToInvest.investAmount - resultSolToInvestInDollar
    const resultUpsideBreakoutUsdc = var_L*(var_VPu - var_VPl);
    const resultDownsideBreakoutSol = var_L*(1/var_VPl - 1/var_VPu);
    const resultUpsideBreakoutGainPercent = (resultUpsideBreakoutUsdc - inputToInvest.investAmount) * 100 / inputToInvest.investAmount

    return { 
      resultSolToInvestInSol,
      resultSolToInvestInDollar,
      resultDollarToInvestInDollar,
      resultUpsideBreakoutUsdc,
      resultDownsideBreakoutSol,
      resultUpsideBreakoutGainPercent
    }
  }

}

export interface InputToInvest {
  rangeMin: number;
  rangeMax: number;
  current: number;
  investAmount: number;
}

@Component({
  selector: 'app-calculator',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, CommonModule, ComputeSolToInvestPipe],
  templateUrl: './calculator.html',
  styleUrl: './calculator.css',
})
export class Calculator implements OnInit{
  protected inputToInvest: InputToInvest = {
    rangeMin: 40,
    rangeMax: 150,
    current: 87.36,
    investAmount: 10_455
  }

  constructor(private cdr: ChangeDetectorRef) {}

async ngOnInit() {
  this.inputToInvest.current = await getPriceByPoolAddress(orcaAddress);
  this.cdr.detectChanges()
}

}


