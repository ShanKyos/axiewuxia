# Nếu làm lại từ đầu: quái vật và bản đồ

> Câu hỏi của chủ dự án: *nếu cho làm lại mọi thứ về map thì sẽ làm quái vật và bản đồ thế nào?*
>
> Đây là **khảo sát + đề xuất**, chưa phải việc đã làm. Mọi con số đo trên bản đang chạy, không
> phải ước lượng. `docs/NGHIEN_CUU_MAP_CAC_GAME.md` đã trả lời phần ĐỊA HÌNH (tile thay vì một
> tấm tranh to) và phần ấy nay đã làm xong — 12/12 map lát viên. Tệp này nói phần chưa ai chạm:
> **quái vật, và map DÙNG ĐỂ LÀM GÌ.**

---

## 1. Ba con số, và cả ba đều chỉ về một chỗ

### ① 96% quái trong game là một khối chỉ số, không phải một sinh vật

| | |
|---|---|
| Tổng quái trên 12 map | **1.112** |
| Mang Dị Biến (có hành vi riêng) | **46** — **4,1%** |
| `comoc` · `caungam` | **0 elite**, tức 0 con có hành vi |

Một con quái thường được mô tả bằng đúng năm số: `speed` · `aggro` · `range` · `atkCd` · `eye`.
Không đòn đặc biệt, không thế đánh, không kiểu di chuyển. 47 định nghĩa quái gom lại chỉ ra
**6 lớp hành vi**, và trong đó **đúng MỘT loài đánh xa bẩm sinh** (`cungthu`).

Hệ `vai` theo bãi (A1) đã che chỗ này rất khéo — nó bật `ranged` lúc sinh, nên đo ra 26,6% quái
đánh xa. Nhưng đó là **một công tắc trên cùng một con**, không phải một sinh vật khác. Cho nên
68 hồ sơ (loài × vai) trải trên 169 bãi: **2,5 bãi dùng chung một hồ sơ**.

**Thứ đáng nói: hành vi thú vị ĐÃ CÓ SẴN — 11 Dị Biến (triệu quân, nổ xác, phân thân, nhiễm độc,
loạn tiễn, dịch ảnh…) — nhưng bị khoá cho elite.** Game đã trả tiền xây cả một hệ hành vi rồi
đem nó cho 4% dân số dùng.

### ② Cuối game phải quét sạch cả map ~90 lần mới qua nổi một dải cấp

Cột cuối = số lần dọn sạch TOÀN BỘ quái trên map để đi hết dải cấp của chính map đó:

| Map | Dải cấp | Số lần quét sạch map |
|---|---|--:|
| Rẻo Rừng Corran | 1-12 | **2,0** |
| Beast Herd Camp | 14-24 | **1,9** |
| Plant Tribe Glade | 38-48 | **3,4** |
| Werebear Woods | 24-38 | **3,8** |
| Lối Mòn Corran | 42-48 | 6,9 |
| Trũng Nứt Corran | 44-50 | 6,3 |
| Bug Tribe Tunnels | 42-56 | 10,2 |
| Aquatic Tribe Causeway | 56-62 | **60,6** |
| Bird Tribe Heights | 62-78 | **91,0** |
| Reptile Sunstone Flats | 84-100 | **95,7** |
| Dusk Marsh | 102-120 | **92,0** |

Đoạn đầu 2-4 lần: hợp lý, map là một NƠI CHỐN đi qua. Từ cấp 56 trở đi vọt lên 60-96 lần: map
thôi là nơi chốn, nó thành một **cỗ máy đếm**. Đây không phải chuyện cân bằng EXP lệch vài chục
phần trăm — nó lệch **~30 lần**, tức đường cong cấp và EXP quái là hai đường không liên quan gì
nhau ở nửa sau.

### ③ Hai phần ba mỗi map không có gì

% ô sàn nằm trong 320px của một bãi quái: **28-38%** ở hầu hết map (`trungnut` 18,4%).

Nghĩa là hai phần ba diện tích ta vừa dựng lại cẩn thận là **đất để đi bộ qua**. Map rộng ra
gấp ba mà nội dung vẫn rải theo một cung hẹp quanh điểm thả, nên "rộng" đọc thành "xa" chứ
không thành "nhiều".

---

## 2. Chẩn đoán: map đang trả lời sai câu hỏi

Cả ba con số là cùng một bệnh, và nó là biến thể của cái bệnh CLAUDE.md đã chẩn ở đầu tệp
(*nội dung làm bằng cách nhân bản*): **map hiện được thiết kế như một CÁI KHO CHỨA QUÁI.**

Câu hỏi mà tầng map đang trả lời là *"đặt bao nhiêu quái, ở đâu, cấp mấy"*. Ba câu hỏi ấy đều
có đáp án bằng SỐ, nên chúng sinh ra thêm bằng cách nhân số lên — thêm map thì nhân, map to ra
thì nhân, cấp cao thì nhân. Và vì mọi thứ đều nhân được, không có gì buộc phải khác đi.

Câu hỏi đúng của một map là: **"chỗ này bắt người chơi làm gì mà chỗ khác không bắt?"**

---

## 3. Nếu làm lại: quái vật

### 3.1 Mở Dị Biến cho quái thường — đây là việc rẻ nhất và đổi nhiều nhất

Hệ đã chạy, đã có bài kiểm, đã cân. Việc duy nhất là gỡ khoá `dbChamp` và cho **một Dị Biến ứng
với một BÃI**, không phải một con. Cả bãi `nhiemdoc` thì đánh bãi ấy phải mang kháng độc; cả bãi
`dichanh` thì không kite được.

Đo trước: 4,1% dân số có hành vi → nếu mỗi bãi mang một Dị Biến thì thành **100%**, mà không vẽ
thêm một tệp art nào và không thêm một loài nào. Cùng đúng lối mà A1 (vai theo bãi) đã đi, và
A1 đã chứng minh lối ấy chạy được.

⚠ Hai chỗ phải cẩn thận: sức Dị Biến trên quái thường phải yếu hơn elite rõ rệt (hiện đã có hệ
số 0,4 cho quái thừa hưởng — dùng lại), và `test_bayquai` đang khoá "đai 0 không có Kẻ Tiếp Sức"
nên map tân thủ phải đứng ngoài đợt này.

### 3.2 Quái cần ĐỘNG TÁC, không cần thêm loài

Thêm loài là nhân bản (thêm một khối chỉ số + một tệp art). Thứ thiếu là **động tác**: một con
lao tới rồi đứng thở, một con đào xuống đất rồi trồi lên sau lưng, một con giữ khiên phía trước
nên phải đánh vòng, một con chạy đi gọi bầy khi máu thấp.

Bốn động tác ấy đổi cách người chơi CẦM CHUỘT. Mười loài mới cùng một động tác thì không.

Hạ tầng đã sẵn: `MOBS` nhận `ranged`, `aggro`, `speed`; `update()` đã có nhánh `fearT` (bỏ chạy)
và Dị Biến đã có `chieubinh` (triệu), `dichanh` (đổi cách áp sát), `phanthan` (phân thân). Tức
là **khung cho động tác đã tồn tại** — nó chỉ chưa được dùng như một trục thiết kế.

### 3.3 Bậc quái theo VAI TRÒ TRONG TRẬN, không theo cấp

Hiện một bãi là 5-8 con cùng loài cùng cấp. Đề xuất: mỗi bãi là một **đội hình** —
1 con giữ tuyến (chậm, nhiều máu), 2-3 con đánh chính, 1 con hỗ trợ (tiếp sức / hồi / buff),
0-1 con quấy rối (đánh xa, rút lui khi bị áp sát).

Cái này A1 đã làm được một nửa (vai theo bãi) và Kẻ Tiếp Sức đã là con thứ ba. Phần thiếu là
**con quấy rối biết rút lui** — thứ duy nhất buộc người chơi phải chọn mục tiêu thay vì quét.

---

## 4. Nếu làm lại: bản đồ

### 4.1 Bỏ mô hình "dải cấp một map" — một map là một BÀI TOÁN, không phải một khoảng cấp

Hiện: map = một khoảng cấp, đi hết khoảng thì sang map sau. Hệ quả là map sau phải *nhân* số
của map trước, và đó là lý do đường cong vọt lên 90 lần quét.

Đề xuất: map = **một bài toán chiến thuật**, và dải cấp chỉ là cửa vào.
- một map mà quái đánh xa áp đảo ⇒ phải dùng địa hình che
- một map mà quái đi theo bầy lớn ⇒ phải kéo lẻ ra
- một map mà quái hồi máu cho nhau ⇒ phải giết đúng thứ tự
- một map tối, tầm nhìn ngắn ⇒ phải đi chậm và nghe

Bốn map ấy có thể **cùng một dải cấp** mà không ai thấy trùng, vì chúng hỏi bốn câu khác nhau.
Và quan trọng hơn: chúng không cần *nhân* nhau để khác nhau.

Đây cũng là chỗ chữa cho ③ — nếu map hỏi một câu, thì hai phần ba đất trống trở thành *chỗ để
trả lời câu ấy* (chỗ né, chỗ vòng, chỗ kéo quái về) chứ không còn là đất thừa.

### 4.2 EXP phải đến từ VIỆC LÀM XONG, không từ số xác

Nguồn EXP hiện gần như chỉ có một: giết quái. Nên khi đường cong cấp dốc lên, cách duy nhất là
giết nhiều hơn — và ra con số 90 lần quét map.

Đề xuất: chia nguồn.
- **Xác quái**: EXP nhỏ, giữ nguyên, làm nền.
- **Dọn sạch một bãi**: thưởng gọn một cục. Biến "cày" thành "làm xong một việc".
- **Mục tiêu map** (Rương Canh, Vỉa Cốt, Trùm Vùng, ải cấp): cục lớn.

Hai hệ sau cùng **đã có sẵn và đã đi đúng hướng này** — Rương Canh mở một lần vĩnh viễn, Vỉa Cốt
một lần mỗi ngày mỗi vùng. Chúng chỉ chưa gánh EXP. Nối EXP vào chúng là kéo con số 90 xuống mà
không đụng một dòng cân bằng quái nào.

### 4.3 Map nhỏ hơn, nhiều hơn, nối bằng rìa

Số đo nói map hiện **28-38% có quái**. Thay vì kéo 4600×3400 cho đầy, cắt thành 2-3 khoảnh
2000×1600 nối bằng lối rìa — mỗi khoảnh một bài toán, mật độ tự lên gấp đôi mà không thêm một
con quái nào.

Hạ tầng cũng đã sẵn: `vung_bon.py` sinh hình theo tham số, lối rìa hai chiều đã chạy, `test_noimap`
đã gác. Đổi khổ là đổi hai con số.

⚠ Đây **ngược** với hướng ba đợt vừa rồi (map to ra 3 lần). Không mâu thuẫn: ba đợt ấy chữa lỗi
*phép chiếu* và *tranh phẳng*, và khổ to là hệ quả của lát viên chứ không phải mục tiêu. Giờ
hình đã đúng thì mới đo được rằng nó rỗng.

---

## 5. Thứ tự nếu bắt tay làm

Xếp theo **đổi nhiều / tốn ít**, không theo thứ tự kể trên:

| # | Việc | Vì sao trước | Tốn |
|--:|---|---|---|
| 1 | Mở Dị Biến cho quái thường, một Dị Biến mỗi bãi | 4,1% → 100% dân số có hành vi. Hệ đã chạy sẵn | thấp |
| 2 | Nối EXP vào Rương Canh · Vỉa Cốt · dọn sạch bãi | kéo 90 lần quét xuống mà không đụng cân bằng quái | thấp |
| 3 | Con quấy rối biết rút lui | thứ duy nhất buộc chọn mục tiêu thay vì quét | vừa |
| 4 | Bốn động tác quái (lao · đào · giữ khiên · gọi bầy) | đổi cách cầm chuột, không tốn art mới | vừa |
| 5 | Cắt map lớn thành khoảnh nhỏ nối rìa | mật độ gấp đôi, hạ tầng đã sẵn | vừa |
| 6 | Map = một bài toán, dải cấp chỉ là cửa | chữa tận gốc, nhưng phải làm 1-5 trước mới có công cụ | cao |

**Việc 1 và 2 cộng lại chữa được cả ba con số ở §1, và cả hai đều dùng hệ đã có.** Đó là chỗ
tôi sẽ bắt đầu nếu được chọn.
