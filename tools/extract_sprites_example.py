from PIL import Image
import numpy as np, json, base64, io
from scipy import ndimage as ndi
im=Image.open('/root/.claude/uploads/a63c908e-eec2-5897-953e-b9add746ca33/814232c9-image.png').convert('RGB');A=np.array(im).astype(int)
def seg(box,thr=40,minw=12,xs=None):
    x0,y0,x1,y1=box;R=A[y0:y1,x0:x1]
    bg=np.median(R.reshape(-1,3),axis=0)
    d=np.abs(R-bg).max(axis=2)>thr
    dd=ndi.binary_dilation(d,iterations=3)
    lab,n=ndi.label(dd);out=[]
    for i in range(1,n+1):
        ys,xx=np.where(lab==i)
        if xx.max()-xx.min()<minw or ys.max()-ys.min()<minw:continue
        out.append((xx.min()+x0,ys.min()+y0,xx.max()+x0+1,ys.max()+y0+1))
    out.sort();return out
def cut(b,fx=False):
    x0,y0,x1,y1=b;R=A[y0:y1,x0:x1];h,w=R.shape[:2]
    # bg by border median
    edge=np.concatenate([R[0],R[-1],R[:,0],R[:,-1]]);bg=np.median(edge,axis=0)
    diff=np.abs(R-bg).max(axis=2)
    if fx:
        a=np.clip((diff-18)*5,0,255)  # soft alpha for glow
        m=a/255
        rgb=np.where(m[...,None]>0,np.clip(R/np.maximum(m[...,None],.25),0,255),0) if False else R
        out=np.dstack([R,a]).astype(np.uint8)
    else:
        m=diff>34
        m=ndi.binary_closing(m,iterations=2);m=ndi.binary_fill_holes(m)
        lab,n=ndi.label(m)
        if n>1:
            sz=ndi.sum(m,lab,range(1,n+1));m=lab==(1+int(np.argmax(sz)))
        m=ndi.binary_erosion(m,iterations=0) if False else m
        out=np.dstack([R,(m*255)]).astype(np.uint8)
    return Image.fromarray(out,'RGBA')
rows={'cleric':(985,86,1360,138),'mage':(215,86,600,141),'knight':(210,408,600,461)}
fxrow=(970,186,1360,239)
res={}
names=['idle','move','atk','cast','hit','dead']
sheet={}
for k,b in rows.items():
    boxes=seg(b);print(k,len(boxes),boxes)
    for n,bb in zip(names,boxes):
        pad=2;bb2=(bb[0]-pad,bb[1]-pad,bb[2]+pad,bb[3]+pad);sheet[k+'_'+n]=cut(bb2)
fb=seg(fxrow,thr=40,minw=14);print('fx',len(fb),fb)
fxn=['heal','burst','shield','purify','revive','judge']
for n,bb in zip(fxn,fb):sheet['fx_'+n]=cut((bb[0]-2,bb[1]-2,bb[2]+2,bb[3]+2),fx=True)
# preview
W=sum(i.width for i in sheet.values())+10*len(sheet);H=max(i.height for i in sheet.values())
pv=Image.new('RGBA',(W,H),(90,110,70,255));x=0
for k,i in sheet.items():pv.alpha_composite(i,(x,0));x+=i.width+10
pv=pv.resize((pv.width*3,pv.height*3),Image.NEAREST);pv.save('t3_preview.png')
out={}
for k,i in sheet.items():
    b=io.BytesIO();i.save(b,'PNG',optimize=True);out[k]=base64.b64encode(b.getvalue()).decode()
json.dump(out,open('t3_art.json','w'));print({k:(sheet[k].size,len(v)) for k,v in out.items()})
