/**
 * @file calculateCrossConnectorReturn
 * @author zhouminghui
 * Computing Equivalent Value
*/

export default function scalculateCrossConnectorReturn(ResBalance, ResWeight, ElfBalance, ElfWeight, pidRes) {
    console.log('bf:', ResBalance, 'wf:', ResWeight, 'bt', ElfBalance, 'wt:', ElfWeight, 'a:', pidRes);
    const bf = ResBalance;
    const wf = ResWeight;
    const bt = ElfBalance;
    const wt = ElfWeight;
    const a = pidRes;
    if (wf === wt) {
        // if both weights are the same, the formula can be reduced
        return (bt * a / (bf - a));
    }

    const x = bt / (bt - a);
    const y = wt / wf;
    return ((Math.pow(x, y) - 1) * bf);
}

