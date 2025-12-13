type ListingUrls = {
  [index: string]: {
    [listing: string]: string;
  };
};

const listingUrls: ListingUrls = {
  A: {
    "aa-af": "https://www.doollee.com/PlaywrightsA/A_playwrights_a-f.php",
    "ag-al": "https://www.doollee.com/PlaywrightsA/A_playwrights_g-l.php",
    "am-ar": "https://www.doollee.com/PlaywrightsA/A_playwrights_m-r.php",
    "as-az": "https://www.doollee.com/PlaywrightsA/A_playwrights_s-z.php",
  },
  B: {
    "baa-baq": "https://www.doollee.com/PlaywrightsB/B_playwrights_baa-baq.php",
    "bar-bar": "https://www.doollee.com/PlaywrightsB/B_playwrights_bar-bar.php",
    "bas-bel": "https://www.doollee.com/PlaywrightsB/B_playwrights_bas-bel.php",
    "bem-bev": "https://www.doollee.com/PlaywrightsB/B_playwrights_bem-bev.php",
    "bew-bla": "https://www.doollee.com/PlaywrightsB/B_playwrights_bew-bla.php",
    "blb-bor": "https://www.doollee.com/PlaywrightsB/B_playwrights_blb-bor.php",
    "bos-bra": "https://www.doollee.com/PlaywrightsB/B_playwrights_bos-bra.php",
    "brb-brn":
      "https://www.doollee.com//PlaywrightsB/B_playwrights_brb-brn.php",
    "bro-bro": "https://www.doollee.com/PlaywrightsB/B_playwrights_bro-bro.php",
    "brp-bzz": "https://www.doollee.com/PlaywrightsB/B_playwrights_brp-bzz.php",
  },
  C: {
    "ca-cf": "https://www.doollee.com/PlaywrightsC/C_playwrights_a-f.php",
    "cg-cl": "https://www.doollee.com/PlaywrightsC/C_playwrights_g-l.php",
    "cm-cr": "https://www.doollee.com/PlaywrightsC/C_playwrights_m-r.php",
    "cs-cz": "https://www.doollee.com/PlaywrightsC/C_playwrights_s-z.php",
  },
  D: {
    "da-df": "https://www.doollee.com/PlaywrightsD/D_playwrights_a-f.php",
    "dg-dl": "https://www.doollee.com/PlaywrightsD/D_playwrights_g-l.php",
    "dm-dr": "https://www.doollee.com/PlaywrightsD/D_playwrights_m-r.php",
    "ds-dz": "https://www.doollee.com/PlaywrightsD/D_playwrights_s-z.php",
  },
  E: {
    "ea-ef": "https://www.doollee.com/PlaywrightsE/E_playwrights_a-f.php",
    "eg-el": "https://www.doollee.com/PlaywrightsE/E_playwrights_g-l.php",
    "em-er": "https://www.doollee.com/PlaywrightsE/E_playwrights_m-r.php",
    "es-ez": "https://www.doollee.com/PlaywrightsE/E_playwrights_s-z.php",
  },
  F: {
    "fa-ff": "https://www.doollee.com/PlaywrightsF/F_playwrights_a-f.php",
    "fg-fl": "https://www.doollee.com/PlaywrightsF/F_playwrights_g-l.php",
    "fm-fr": "https://www.doollee.com/PlaywrightsF/F_playwrights_m-r.php",
    "fs-fz": "https://www.doollee.com/PlaywrightsF/F_playwrights_s-z.php",
  },
  G: {
    "ga-gf": "https://www.doollee.com/PlaywrightsG/G_playwrights_a-f.php",
    "gg-gl": "https://www.doollee.com/PlaywrightsG/G_playwrights_g-l.php",
    "gm-gr": "https://www.doollee.com/PlaywrightsG/G_playwrights_m-r.php",
    "gs-gz": "https://www.doollee.com/PlaywrightsG/G_playwrights_s-z.php",
  },
  H: {
    "ha-hf": "https://www.doollee.com/PlaywrightsH/H_playwrights_a-f.php",
    "hg-hl": "https://www.doollee.com/PlaywrightsH/H_playwrights_g-l.php",
    "hm-hr": "https://www.doollee.com/PlaywrightsH/H_playwrights_m-r.php",
    "hs-hz": "https://www.doollee.com/PlaywrightsH/H_playwrights_s-z.php",
  },
  I: {
    "ia-if": "https://www.doollee.com/PlaywrightsI/I_playwrights_a-f.php",
    "ig-il": "https://www.doollee.com/PlaywrightsI/I_playwrights_g-l.php",
    "im-ir": "https://www.doollee.com/PlaywrightsI/I_playwrights_m-r.php",
    "is-iz": "https://www.doollee.com/PlaywrightsI/I_playwrights_s-z.php",
  },
  J: {
    "ja-jf": "https://www.doollee.com/PlaywrightsJ/J_playwrights_a-f.php",
    "jg-jl": "https://www.doollee.com/PlaywrightsJ/J_playwrights_g-l.php",
    "jm-jr": "https://www.doollee.com/PlaywrightsJ/J_playwrights_m-r.php",
    "js-jz": "https://www.doollee.com/PlaywrightsJ/J_playwrights_s-z.php",
  },
  K: {
    "ka-kf": "https://www.doollee.com/PlaywrightsK/K_playwrights_a-f.php",
    "kg-kl": "https://www.doollee.com/PlaywrightsK/K_playwrights_g-l.php",
    "km-kr": "https://www.doollee.com/PlaywrightsK/K_playwrights_m-r.php",
    "ks-kz": "https://www.doollee.com/PlaywrightsK/K_playwrights_s-z.php",
  },
  L: {
    "la-lf": "https://www.doollee.com/PlaywrightsL/L_playwrights_a-f.php",
    "lg-ll": "https://www.doollee.com/PlaywrightsL/L_playwrights_g-l.php",
    "lm-lr": "https://www.doollee.com/PlaywrightsL/L_playwrights_m-r.php",
    "ls-lz": "https://www.doollee.com/PlaywrightsL/L_playwrights_s-z.php",
  },
  M: {
    "ma-mf": "https://www.doollee.com/PlaywrightsM/M_playwrights_a-f.php",
    "mg-ml": "https://www.doollee.com/PlaywrightsM/M_playwrights_g-l.php",
    "mm-mr": "https://www.doollee.com/PlaywrightsM/M_playwrights_m-r.php",
    "ms-mz": "https://www.doollee.com/PlaywrightsM/M_playwrights_s-z.php",
  },
  N: {
    "na-nf": "https://www.doollee.com/PlaywrightsN/N_playwrights_a-f.php",
    "ng-nl": "https://www.doollee.com/PlaywrightsN/N_playwrights_g-l.php",
    "nm-nr": "https://www.doollee.com/PlaywrightsN/N_playwrights_m-r.php",
    "ns-nz": "https://www.doollee.com/PlaywrightsN/N_playwrights_s-z.php",
  },
  O: {
    "oa-of": "https://www.doollee.com/PlaywrightsO/O_playwrights_a-f.php",
    "og-ol": "https://www.doollee.com/PlaywrightsO/O_playwrights_g-l.php",
    "om-or": "https://www.doollee.com/PlaywrightsO/O_playwrights_m-r.php",
    "os-oz": "https://www.doollee.com/PlaywrightsO/O_playwrights_s-z.php",
  },
  P: {
    "pa-pf": "https://www.doollee.com/PlaywrightsP/P_playwrights_a-f.php",
    "pg-pl": "https://www.doollee.com/PlaywrightsP/P_playwrights_g-l.php",
    "pm-pr": "https://www.doollee.com/PlaywrightsP/P_playwrights_m-r.php",
    "ps-pz": "https://www.doollee.com/PlaywrightsP/P_playwrights_s-z.php",
  },
  Q: {
    "qa-qz": "https://www.doollee.com/PlaywrightsQ/3PlaywrightsQdata.php",
  },
  R: {
    "ra-rf": "https://www.doollee.com/PlaywrightsR/R_playwrights_a-f.php",
    "rg-rl": "https://www.doollee.com/PlaywrightsR/R_playwrights_g-l.php",
    "rm-rr": "https://www.doollee.com/PlaywrightsR/R_playwrights_m-r.php",
    "rs-rz": "https://www.doollee.com/PlaywrightsR/R_playwrights_s-z.php",
  },
  S: {
    "sa-sf": "https://www.doollee.com/PlaywrightsS/S_playwrights_a-f.php",
    "sg-sl": "https://www.doollee.com/PlaywrightsS/S_playwrights_g-l.php",
    "sm-sr": "https://www.doollee.com/PlaywrightsS/S_playwrights_m-r.php",
    "ss-sz": "https://www.doollee.com/PlaywrightsS/S_playwrights_s-z.php",
  },
  T: {
    "ta-tf": "https://www.doollee.com/PlaywrightsT/T_playwrights_a-f.php",
    "tg-tl": "https://www.doollee.com/PlaywrightsT/T_playwrights_g-l.php",
    "tm-tr": "https://www.doollee.com/PlaywrightsT/T_playwrights_m-r.php",
    "ts-tz": "https://www.doollee.com/PlaywrightsT/T_playwrights_s-z.php",
  },
  U: {
    "ua-uz": "https://www.doollee.com/PlaywrightsU/U_playwrights_a-z.php",
  },
  W: {
    "wa-wf": "https://www.doollee.com/PlaywrightsW/W_playwrights_a-f.php",
    "wg-wl": "https://www.doollee.com/PlaywrightsW/W_playwrights_g-l.php",
    "wm-wr": "https://www.doollee.com/PlaywrightsW/W_playwrights_m-r.php",
    "ws-wz": "https://www.doollee.com/PlaywrightsW/W_playwrights_s-z.php",
  },
  X: {
    "xa-xz": "https://www.doollee.com/PlaywrightsX/3PlaywrightsXdata.php",
  },
  Y: {
    "ya-yf": "https://www.doollee.com/PlaywrightsY/Y_playwrights_a-f.php",
    "yg-yl": "https://www.doollee.com/PlaywrightsY/Y_playwrights_g-l.php",
    "ym-yr": "https://www.doollee.com/PlaywrightsY/Y_playwrights_m-r.php",
    "ys-yz": "https://www.doollee.com/PlaywrightsY/Y_playwrights_s-z.php",
  },
  Z: {
    "za-zf": "https://www.doollee.com/PlaywrightsZ/Z_playwrights_a-f.php",
    "zg-zl": "https://www.doollee.com/PlaywrightsZ/Z_playwrights_g-l.php",
    "zm-zr": "https://www.doollee.com/PlaywrightsZ/Z_playwrights_m-r.php",
    "zs-zz": "https://www.doollee.com/PlaywrightsZ/Z_playwrights_s-z.php",
  },
};

export default listingUrls;
