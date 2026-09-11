# Thiết kế thị trấn khởi đầu — đo Ardhaven, đối chiếu Lorencia và Kyovashad

> Đo bằng `node tools/do_thanh.cjs --dexuat` — đọc thẳng `MAPS.ardhaven` và `NPCS` trong
> `data/canbang.js`, nên số ở đây luôn khớp game đang chạy. **Đừng chép số vào đây bằng tay.** Mọi con số về Ardhaven trong tài liệu này là **đo được**.
> Số về Lorencia là **suy từ toạ độ NPC công bố**, có ghi rõ chỗ nào là ước lượng.

---

## 0. Kết luận trước, lý lẽ sau

**Thành không sai ở KHỔ. Thành sai ở chỗ nội dung được rải ĐỀU trên khổ đó.**

Lorencia cũng nằm trên một map 256×256 — bằng đúng mọi map săn khác của MU. Cái khác là
**lõi thị trấn của nó chỉ chiếm 11×31 ô**, tức khoảng **0,5% diện tích map**. Thành thì nhỏ,
map thì to, và hai chuyện đó độc lập với nhau. Ardhaven đang trộn hai chuyện đó làm một:
khổ 6400×3200 kéo theo 16 khối nhà rải đều hai mép, nên **mọi thứ đều xa**.

Ba việc phải làm, theo thứ tự:

1. **Gom dịch vụ chạm-mỗi-chuyến về một LÕI lọt trong một khung hình** (hiện đang trải 4060px).
2. **Đừng lấp dải giữa bằng nhà** — lấp bằng một mốc định hướng + sạp chợ lặp lại.
3. **Đổi map sau bốn cổng** — cổng gần nhất phải là cổng người chơi cấp 1 đi được.

Giữ nguyên tường thành 6400×3200. Không đụng `diTrong`, không đụng lưới phố, không đụng
bốn cổng. Ba việc trên đều là **dời dữ liệu**, và việc 1 còn **giảm** đơn hàng art.

---

## 1. Hiện trạng, đo được

### 1.1 Khổ

| | |
|---|---|
| Khung | **6400×3200 = 20,48 Mpx** |
| So với một map hoang dã (2600×1900) | **4,15×** |
| Đi được (`diTrong`, lưới 24px) | 82,4% = 29 266 ô |
| Số màn hình ở zoom mặc định (XA 1,0× · 1920×1080) | **9,9 màn hình** |
| Ở zoom VỪA (1,45×) | 20,8 màn hình |

### 1.2 Thành là một cái BÁNH VÒNG — ruột rỗng

16 khối nhà nằm hết ở hai hàng sát tường: hàng bắc `y 520-860`, hàng nam `y 2340-2680`.
Giữa hai hàng là một dải **6400×1480 = 9,47 Mpx** không có một công trình nào.

> Dải rỗng đó **rộng gấp 1,92 lần cả một map hoang dã**, và bằng **4,6 khung hình**.

Và người chơi **hiện ra ngay giữa nó** (`spawn: 3200,1900`).

### 1.3 Thứ tự ưu tiên đang bị LẬT NGƯỢC

Bán kính từ điểm thả tới từng nhóm chức năng:

| Nhóm | Khoảng cách | Đi bộ |
|---|---|---|
| Chạm **mỗi chuyến** (Tiệm Thuốc · Lò Rèn · Vũ Khí) | **1645 – 2840px** | 7,9 – 13,6 s |
| Chạm **vài phiên một lần** (Truy Nã · Chimera · Chuồng · Cầu May · Vực) | **728 – 1842px** | 3,5 – 8,8 s |

Thứ dùng ít thì đứng gần, thứ dùng nhiều nhất thì đứng xa nhất. Đây không phải một quyết
định nào cả — nó là hệ quả của việc ba tiệm cùng được xếp vào hàng nhà bắc vì **hàng bắc là
hàng duy nhất có mặt tiền quay ra phố** (sprite isometric luôn quay mặt xuống dưới).

### 1.4 Vòng tiếp tế: 47,7 giây đi bộ suông

Về từ bãi săn qua cổng Nam → mua thuốc → rèn đồ → bán/mua vũ khí → ra lại cổng Nam:

```
2499px  +  3400px  +  660px  +  3406px  =  9965px
                                        =  47,7 giây, không một sự kiện nào trên đường
```

Riêng **Tiệm Thuốc ↔ Vũ Khí Phường cách nhau 4060px** — rộng gấp **2,1 lần** một khung hình,
nên **không có vị trí đứng nào nhìn thấy được cả ba tiệm**.

### 1.5 Mật độ

| | |
|---|---|
| NPC trong thành | 24 |
| Trong đó **có chức năng** (`forge`/`shop`/`stable`/`trunya`/`vanduyen`/`tenui`) | **8** |
| Còn lại `talk:'quest'` (lore, không bấm ra hệ thống nào) | 16 |
| NPC lọt trong MỘT khung hình quanh điểm thả | **6 / 24** |
| Đất đi được cách **mọi** điểm nội dung > 400px | **41,7%** |
| Điểm nội dung / 1000 ô (sàn `test_domap` = 1,30) | **0,99** — phải nhờ thảo dược mới qua |

Một chức năng trên mỗi **2,56 Mpx** — tức mỗi chức năng chiếm nửa map hoang dã.

### 1.6 Cổng gần nhất là cổng người chơi cấp 1 KHÔNG đi được

| Cổng | Tới | Cấp tối thiểu | Từ điểm thả |
|---|---|--:|---|
| Nam | Beast Herd Camp | **10** | 1010px · 4,8 s |
| Bắc | Bird Tribe Heights | **60** | 1610px · 7,7 s |
| **Tây** | **Rẻo Rừng Corran** | **1** | **2736px · 13,1 s** |
| Đông | Werebear Woods | 20 | 2736px · 13,1 s |

Việc đầu tiên của một nhân vật mới tạo là **đi bộ 13 giây tới cái cổng xa nhất**, đi ngang qua
hai cái cổng gần hơn mà nó bị khoá. Đây là ấn tượng đầu tiên của game.

### 1.7 Nợ art

`vatTo` có 7 mục: 4 là cổng thành ⇒ **3 công trình / 16 khối**. Mười ba khối còn lại đang chờ
art, và con số 16 khối vốn bị **sàn mật độ `test_domap` ép ra**, không phải chọn cho đẹp.

---

## 2. Lorencia làm gì khác

Suy từ toạ độ NPC công bố (Lumen 123,135 · Pet Trainer 122,110 · Pasi 118,113 ·
Hanzo 116,141 · điểm dịch chuyển 125,125):

**Lõi Lorencia ≈ 11 × 31 ô**, trên một map **256×256** ⇒ khoảng **0,5% diện tích map**.

Ba thương nhân còn lại nằm **ngay ngoài ba cổng**, cách lõi 40–60 ô:
Amy (127,86) ngoài cổng Nam · Alex (62,130) ngoài cổng Tây · Wandering Merchant (182,136)
ngoài cổng Đông.

Quy đổi lõi Lorencia sang thang của game này — lấy **một ô MU ≈ một bề ngang thân nhân vật**
(thân vẽ ra 92×38px, đo bằng `TEST_TO_PHANG`), và cho cả biên an toàn gấp đôi:

| Giả định | Lõi Lorencia quy đổi | So với Ardhaven 20,48 Mpx |
|---|---|---|
| 1 ô = 1 thân (38px) | 418 × 1178px = **0,49 Mpx** | Ardhaven gấp **42×** |
| 1 ô = 2 thân (76px) | 836 × 2356px = **1,97 Mpx** | Ardhaven gấp **10×** |

Kể cả ở giả định rộng rãi nhất, **lõi Lorencia vẫn lọt gọn trong một khung hình của game này.**

**Ba điều Lorencia làm mà Ardhaven chưa:**

1. **Lõi nhỏ, map to.** Map 256×256 là map to. Thành thì 11×31 ô. Cảm giác "thế giới rộng"
   không đến từ việc kéo tường thành ra xa — nó đến từ **bãi săn bắt đầu ngay ngoài cổng**.
2. **Không có màn chuyển map giữa thành và trận đánh đầu tiên.** Lorencia **là** bãi săn cấp
   1-20; vùng an toàn chỉ là một cái dấu đóng giữa nó. Người mới đi 40 ô từ đài nước là đã
   đánh nhau — không cổng, không nạp map.
3. **Có một mốc để định hướng.** Đài nước / quán bar là chỗ ai cũng lấy làm gốc toạ độ.
   Ardhaven hiện **không có một hình bóng nào** để nói "gặp nhau ở chỗ kia".

## 3. Kyovashad (Diablo IV) xác nhận cùng một điều, từ phía ngược lại

Kyovashad được người chơi chấm là hub tốt nhất **đúng vì nó chật**: mọi dịch vụ nằm sát nhau,
đi vài bước là xong. Ked Bardu — cùng game, cùng bộ dịch vụ, nhưng trải rộng — thì bị chê
đúng vì chuyện đó, và cuộc tranh luận về nó là một cuộc tranh luận về **quãng đi bộ**, không
phải về art.

D4 còn thêm một van an toàn mà game này đã có sẵn: **cắm cổng dịch chuyển theo thành**. Ở đây
`travelTo` thả người chơi đúng `MAPS.ardhaven.spawn` — nên chỉ cần LÕI nằm tại điểm thả là
mọi chuyến dịch chuyển về thành tự động rơi vào giữa chợ.

---

## 4. ĐỀ XUẤT — ba vòng, đo từ điểm thả

Giữ tường thành. Giữ `diTrong`. Giữ lưới phố. Giữ bốn cổng. Chỉ **xếp lại nội dung**.

| Vòng | Bán kính | Chứa gì | Luật cứng |
|---|---|---|---|
| **LÕI** · Quảng Trường Atia | ≤ **800px** (≤3,8 s) | Tiệm Thuốc · Lò Rèn · Vũ Khí Phường · Quán Trọ | **Cả bốn phải nhìn thấy cùng lúc trong một khung hình 1920×1080** |
| **VÀNH** · hai hàng nhà cũ | 800 – 2000px | Sảnh Cầu May · Quan Truy Nã · Vực Thẳm · Chuồng · Luyện Chimera · Thợ Nhuộm · Thợ Mộc | Chạm vài phiên một lần ⇒ **được phép** bắt đi bộ |
| **MÉP** · bốn cổng + xóm | 2000 – 3200px | Bốn lính gác · nhà dân · NPC không khí | **Không một chức năng bắt buộc nào** |

### 4.1 LÕI — hai khối nhà, bốn NPC, một khung hình

Ràng buộc hình: mặt tiền sprite isometric quay **xuống dưới**, nên NPC phải đứng ở **phía nam**
khối nhà của mình. Do đó lõi là một **hàng nhà + quảng trường bên dưới**, không phải một
quảng trường bốn mặt có nhà.

Hai khối đặt hai bên đại lộ dọc `x=3200`, chừa lối 720px ở giữa:

| Khối | Hộp 460×340 | NPC đứng trước (y = 1510) | Cách điểm thả |
|---|---|---|---|
| **A** · Phố Chợ | x 2380–2840, y 1100–1440 | `duoclao` (2480,1510) · `trachu` (2740,1510) | **776px · 544px** |
| **B** · Phố Lò | x 3560–4020, y 1100–1440 | `thoren` (3660,1510) · `binhkhi` (3920,1510) | **544px · 776px** |

- **Bốn NPC trải 1440px < 1920px** ⇒ đứng ở điểm thả nhìn thấy hết. Luật cứng thoả.
- **Hai NPC một khối** là cố ý — Lorencia và Kyovashad đều xếp nhiều quầy quanh một chỗ,
  không phải một nhà một quầy. Nó cũng **cắt đơn hàng art xuống hai tấm** cho cả lõi.
- Khối cách đại lộ ngang `y=1600` đúng 160px và đại lộ dọc `x=3200` đúng 360px ⇒ không khối
  nào chặn phố.
- **Điểm thả dời xuống `y=1800`** (từ 1900) ⇒ bốn quầy cách 544–776px, tức **2,6–3,7 giây**.

Đã chạy kiểm hình học (`tools/do_thanh.cjs --dexuat`, mục 7): bốn điểm NPC và tám góc của hai khối
đều nằm trong `diTrong`; hai khối mới **không đè khối nào** trong 16 khối `MAP_OBSTACLES`
hiện có (cả 16 đều ở `y=520` hoặc `y=2340`); mép nam khối cách đại lộ ngang 160px và khe
giữa hai khối rộng 720px ôm đúng đại lộ dọc.

**Vòng tiếp tế mới:** cổng Nam → bốn quầy → cổng Nam = **4894px ≈ 23,4 s**,
so với **9965px ≈ 47,7 s** hiện nay. **Giảm một nửa.**

### 4.2 VÀNH — hai hàng nhà cũ giữ nguyên chỗ, đổi vai

| Hàng | Khối dùng | Thành |
|---|---|---|
| BẮC `y 520` | 4 / 8 | **Phố Nghề** — Sảnh Cầu May · Quan Truy Nã · Kẻ Trông Vách · Thợ Nhuộm |
| NAM `y 2340` | 3 / 8 | **Xóm Thợ** — Người Giữ Chuồng · Luyện Chimera · Thợ Mộc |

⚠ Ba khối hàng **nam** đang có NPC đứng ở phía **bắc** khối (`ah_mucdong` 2160,2450) — tức là
NPC đứng sau lưng công trình. Khi cắm art phải dời NPC xuống `y ≥ 2700`, hoặc xin bản art
quay ngược. Đã ghi trong `data/canbang.js` nhưng chưa xử.

### 4.3 MÉP và dải giữa — ĐỪNG lấp bằng nhà

Chín khối còn trống sau khi xếp lại **không cần thành công trình**. Nợ art từ **13 tấm xuống 6**
(2 lõi + 4 vành). Chín khối kia dựng bằng **vật lặp lại**: tường rào, sân trong, đống củi,
giàn phơi — cùng bộ prop dùng lại chín lần, không tấm nào là tấm riêng.

Dải giữa 6400×1480 lấp bằng **ba thứ, không có thứ nào là nhà**:

1. **Một MỐC ĐỊNH HƯỚNG ở ngã tư (3200,1600).** Đây là thứ Ardhaven thiếu hẳn. Đề xuất
   **Giếng Ardhaven** — cái giếng rơi qua vết nứt còn nguyên, đã nằm sẵn trong `desc` của map
   ("nguyên mái, nguyên giếng, nguyên cả biển hiệu") và Quảng Trường Cũ trước đây cũng đúng
   một cái giếng trong `MAP_OBSTACLES`. Một tấm art, đứng giữa lõi, mọi chỗ khác trong thành
   tả theo nó.
2. **Sạp Chợ Phiên** kẹp hai bên đại lộ ngang `y=1600`, trong khoảng `x 1500–4900`. Đây là
   cách rẻ nhất giết đất chết: mật độ của Lorencia phần lớn đến từ **quầy hàng của người chơi**,
   mà game này một người chơi nên phải dựng bằng prop. 3–4 sprite mái vải lặp lại, đặt qua
   `vatDat`.
3. **Hai phần ba ngoài (`x < 1500` và `x > 4900`) để YÊN.** Đó là thứ làm tường thành ở xa,
   và nó không tốn gì **miễn là không có dịch vụ bắt buộc nào sống ở đó**.

### 4.4 Đổi map sau bốn cổng

Cổng gần nhất phải là cổng người chơi cấp 1 đi được:

| Cổng | Nay | Đề xuất | Lý do |
|---|---|---|---|
| **Nam** (1010px) | Beast Herd Camp (c10) | **Rẻo Rừng Corran (c1)** | Bãi săn đầu tiên phải ở cổng gần nhất |
| **Tây** (2736px) | Rẻo Rừng Corran (c1) | **Beast Herd Camp (c10)** | Cấp 10 thì đi thêm 1700px là chấp nhận được |
| Bắc · Đông | giữ | giữ | |

Kèm theo: `GATES` hai chiều, `spawnFrom` của hai map đó, và lời thoại bốn lính gác đổi chỗ
theo (mỗi người tả đúng vùng sau lưng mình).

*Nếu chưa muốn đụng hình học:* bước đệm là cho lính gác cổng Nam và cổng Bắc **chỉ đường sang
cổng Tây** khi người chơi dưới cấp 10 — vá được ấn tượng đầu, nhưng không vá được quãng đi bộ.

---

## 5. Bảng trước / sau

| Chỉ số | Nay | Sau | |
|---|--:|--:|---|
| Vòng tiếp tế (cổng → mua bán → cổng) | 9965px · 47,7 s | **4894px · 23,4 s** | −51% |
| Trải rộng dịch vụ chạm-mỗi-chuyến | 4060px (2,1 màn hình) | **1440px (0,75 màn hình)** | lọt một khung hình |
| Dịch vụ xa nhất tính từ điểm thả | 2840px · 13,6 s | **776px · 3,7 s** | −73% |
| Cổng của người chơi cấp 1 | 2736px (xa nhất) | **1010px (gần nhất)** | −63% |
| Công trình còn nợ art | 13 | **6** | −54% |
| Mốc định hướng của thành | 0 | **1** (Giếng Ardhaven) | |
| Khổ map · `diTrong` · lưới phố · 4 cổng | | **không đổi** | |

---

## 6. Thứ tự làm, mỗi bước kiểm được

| Đợt | Việc | Kiểm bằng |
|---|---|---|
| **T1** | Dời 4 NPC lõi + điểm thả về ngã tư. Chỉ sửa toạ độ trong `data/canbang.js`. | `test_sandat` (NPC đứng trên sàn) · `test_domap` (mật độ) · `tools/do_thanh.cjs` |
| **T2** | Đổi map sau cổng Nam ↔ Tây (`GATES` · `spawnFrom` · lore 4 lính gác) | `test_noimap` §1 — lan theo đường người chơi từ cấp 1 |
| **T3** | Giếng Ardhaven: 1 tấm art + 1 mục `vatTo` + 1 khối `MAP_OBSTACLES` | chụp màn hình — **hình chỉ lộ lỗi khi render ra xem** |
| **T4** | Sạp Chợ Phiên: 3–4 sprite mái vải, rải qua `vatDat` dọc `y=1600` | `tools/do_thanh.cjs` mục 3 — đất chết >400px phải tụt dưới 30% |
| **T5** | 6 tấm công trình cho lõi + vành; 9 khối còn lại dùng prop lặp | `docs/DAT_HANG_ART_THANH.md` §2 |

⚠ **T1 đứng độc lập và rẻ nhất** — không tấm art nào, không sửa engine, chỉ đổi năm cặp toạ độ.
Nó lấy được **hơn nửa** lợi ích trong bảng §5. Làm nó trước rồi mới quyết mấy đợt sau.

---

## 7. Những chỗ ĐÃ CÂN NHẮC VÀ BỎ

- **Thu nhỏ tường thành về ~3200×2000.** Đạt cùng mục đích, nhưng chủ dự án đã chốt khổ
  6400×3200 chính vì thành cũ nhỏ hơn một map hoang dã khiến "vào thành" thành bước vào một
  cái sân. Lorencia chứng minh **không cần đánh đổi**: map to và lõi nhỏ sống chung được.
- **Thêm khối nhà vào dải giữa cho đỡ trống.** Đây đúng là bệnh đã chẩn trong `CLAUDE.md`
  (*"nội dung đang được làm bằng cách nhân bản"*). Chín khối trống hiện tại đã là nợ art;
  thêm khối là nhân nợ lên.
- **Cho quái vào trong tường như Lorencia.** Lorencia làm được vì nó **không phải một cái
  thành có tường** — nó là đồng bằng với một vùng an toàn đóng dấu ở giữa. Ardhaven có tường,
  có `type:'safe'`, và lore nói rõ *"Không Chimera nào vào được"*. Chỗ đúng để rút ngắn khoảng
  cách tới trận đánh đầu tiên là **§4.4**, không phải thả quái vào chợ.
- **Lấp đất chết bằng thêm NPC `talk:'quest'`.** Đã có 16 người như vậy. Người thứ 17 không
  thêm được việc gì để làm, chỉ thêm một cái tên để đi ngang qua.

---

## 8. Nguồn

- [MU Online — bảng map, lưới 256×256 và tệp `.att`](https://muonline.net/guides/mu-online-maps/)
- [MU Online Fanz — Lorencia](https://muonlinefanz.com/tools/maps/data/mapdb/Lorencia.php)
- [MU Online Wiki — NPC và toạ độ](https://muonline.fandom.com/wiki/NPCs)
- [MU Online Wiki — Maps](https://muonline.fandom.com/wiki/Maps)
- [GameSpot — Diablo IV Kyovashad hub guide](https://www.gamespot.com/articles/diablo-4-kyovashad-hub-city-guide/1100-6512473/)
- [Diablo Wiki — Kyovashad](https://diablo.fandom.com/wiki/Kyovashad)
- [Diablo Wiki — Ked Bardu](https://diablo.fandom.com/wiki/Ked_Bardu)
- [Bàn luận về bố cục Ked Bardu](https://www.zleague.gg/theportal/diablo-4-thoughts-on-the-layout-of-ked-bardu-a-reddit-discussion/)
