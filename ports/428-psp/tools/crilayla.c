#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
/* usage: crilayla in out */
static const uint8_t*src; static long ioff; static int bl; static uint8_t pool;
static unsigned gb(int n){unsigned o=0;int p=0;while(p<n){if(!bl){pool=src[ioff--];bl=8;}int t=bl<n-p?bl:n-p;o=(o<<t)|((pool>>(bl-t))&((1u<<t)-1));bl-=t;p+=t;}return o;}
int main(int c,char**v){FILE*f=fopen(v[1],"rb");fseek(f,0,2);long n=ftell(f);fseek(f,0,0);uint8_t*d=malloc(n);fread(d,1,n,f);fclose(f);
 if(memcmp(d,"CRILAYLA",8)){fprintf(stderr,"not crilayla\n");return 1;}
 uint32_t us=d[8]|d[9]<<8|d[10]<<16|d[11]<<24, ho=d[12]|d[13]<<8|d[14]<<16|d[15]<<24;
 uint8_t*r=calloc(us+0x100,1);memcpy(r,d+ho+0x10,0x100);src=d;ioff=n-0x100-1;bl=0;
 long oe=0x100+us-1,bo=0;int vl[4]={2,3,5,8};
 while(bo<(long)us){if(gb(1)){long bro=oe-bo+gb(13)+3;long len=3;int lv;for(lv=0;lv<4;lv++){unsigned t=gb(vl[lv]);len+=t;if(t!=(1u<<vl[lv])-1)break;}
   if(lv==4){unsigned t;do{t=gb(8);len+=t;}while(t==255);}
   for(long i=0;i<len&&bo<(long)us+0;i++){r[oe-bo]=r[bro--];bo++;}}
  else{r[oe-bo]=gb(8);bo++;}}
 f=fopen(v[2],"wb");fwrite(r,1,us+0x100,f);fclose(f);return 0;}
