---
name: axie-hinh-hoa
description: Luật vẽ và đặt hàng hình ảnh Axie cho Axie Rift — cấu tạo sáu bộ phận, chín lớp, và các dòng sưu tầm. Dùng khi vẽ, cắt, đặt hàng hay duyệt bất kỳ tranh Axie nào (NPC, quái, icon, thú cưỡi, minh hoạ).
---

# Hình hoạ Axie — luật để một con Axie vẽ ra "đúng người"

Nguồn gốc: chủ dự án chỉ định *The Axie Collector's Guide* (blog.axieinfinity.com) làm chuẩn
tham chiếu cho hình ảnh Axie trong dự án này.

> ⚠ **TỆP NÀY CÒN DỞ, VÀ CHỖ DỞ ĐƯỢC ĐÁNH DẤU.**
> Máy chạy phiên này KHÔNG tải được bài viết: `blog.axieinfinity.com`,
> `support.axieinfinity.com`, `axieinfinity.medium.com` và cả bản chép ở `cryptogloom.com`
> đều bị tường lửa mạng chặn (`EGRESS_BLOCKED`). Phần §1-§2 dưới đây là thứ chắc chắn và
> kiểm được ngay trong art của chính dự án. Phần §3 là phần PHẢI lấy từ bài viết — nó đang
> để trống có chủ ý.
>
> **Đừng đoán rồi điền vào §3.** Một bộ luật hình hoạ mà nửa đúng nửa phịa còn tệ hơn không
> có bộ nào: nó biến cái sai thành cái được viện dẫn. Cách điền: dán nội dung bài viết vào
> phiên làm việc, hoặc lưu thành `docs/AXIE_COLLECTOR_GUIDE.md` rồi bảo tôi rút luật ra.

---

## 1. Cấu tạo — sáu bộ phận, không hơn không kém

Một con Axie luôn dựng từ **sáu bộ phận**, và mọi tranh Axie trong dự án phải đọc ra đủ sáu:

| Bộ phận | Ghi chú vẽ |
|---|---|
| **Mắt** (Eyes) | Thuần trang trí trong bản gốc — nhưng là thứ đọc ra "tính cách" nhanh nhất. |
| **Tai** (Ears) | Thuần trang trí. Cặp đôi, đối xứng. |
| **Sừng** (Horn) | Mọc trên đỉnh đầu. Đây là bộ phận NHẬN DẠNG mạnh nhất khi nhìn từ xa. |
| **Miệng** (Mouth) | |
| **Lưng** (Back) | Vỏ / cánh / gai mọc trên lưng — bóng dáng nhìn nghiêng phụ thuộc chỗ này. |
| **Đuôi** (Tail) | |

**Thân là một khối tròn mập, chân ngắn.** Đây là thứ giữ cho một con Axie ra Axie kể cả khi
sáu bộ phận đổi hết. Vẽ thân dài ra, hay cho nó đứng hai chân kiểu người, là ra một sinh vật
khác — kiểm bằng cách che hết sáu bộ phận đi: cái còn lại vẫn phải đọc ra Axie.

---

## 2. Chín lớp và màu của chúng

Sáu lớp cơ bản: **Beast · Aquatic · Plant · Bird · Bug · Reptile**
Ba lớp hiếm: **Mech · Dawn · Dusk**

Màu thân đi theo lớp, và đó là tín hiệu đọc-trong-một-nhịp của cả hệ thống. Trong dự án này,
năm lớp nhân vật và các NPC/quái đã bám theo bảng đó — **đối chiếu với art đang có trước khi
vẽ mới**, đừng lấy màu từ trí nhớ:

```
public/game/assets/npcs/     — NPC đã duyệt
public/game/assets/mobs/     — quái đã duyệt
public/game/assets/iso/      — icon giao diện (bộ ic_*.png)
```

Bảng màu cụ thể của từng lớp: xem `docs/LORE_BIBLE.md` và art trong hai thư mục trên.

---

## 3. Các dòng sưu tầm — @CẦN ĐIỀN TỪ BÀI VIẾT@

Đây là phần bài viết nói mà tôi chưa đọc được. Mỗi mục cần: **dấu hiệu NHÌN THẤY được**
(màu, nét vẽ bộ phận, phụ kiện, nhãn), chứ không phải chỉ độ hiếm.

- **Origin** — @CẦN ĐIỀN@
- **Mystic** — biết chắc: là bộ phận đặc biệt chỉ có ở một số Axie Origin, **nét vẽ khác hẳn**
  bộ phận Common tương ứng, không di truyền được, không sinh thêm nữa. Mỗi bộ phận có xác
  suất 1/18 ra Mystic khi roll Origin; một con có thể mang nhiều Mystic (double/triple/quad).
  @CẦN ĐIỀN: nét vẽ khác ở CHỖ NÀO — màu, chất liệu, hay hình dáng?@
- **Agamogenesis** — biết chắc: tổng cung **đúng ba con**. @CẦN ĐIỀN: nhìn ra sao?@
- **MEO / Meo Corp** — biết chắc: chỉ ra từ trứng bán ở Axie Egg Lab, theo mùa. @CẦN ĐIỀN@
- **Japanese** — @CẦN ĐIỀN@
- **Xmas** — @CẦN ĐIỀN@
- **Summer** — @CẦN ĐIỀN@
- **Shiny** — @CẦN ĐIỀN@
- **Nightmare** — @CẦN ĐIỀN@
- **Founder** — @CẦN ĐIỀN@

Biết chắc thêm: **Radiant Spirit Shell** là vật phẩm dùng để tiến hoá bộ phận của Axie sưu
tầm (Mystic · Japanese · Xmas · Summer · Shiny · Agamogenesis), và bộ phận Mystic tiến hoá
lên được thành **Legendary**.

---

## 4. Cách dùng bộ luật này

**Khi ĐẶT HÀNG art** (prompt cho Gemini/meowa): nêu rõ lớp, rồi nêu sáu bộ phận theo tên.
Không viết "một con Axie dễ thương" — viết "Beast Axie, sừng cong ngắn, tai cụp, mắt tròn to,
lưng có bờm, đuôi xù". Bộ phận không nêu thì máy tự bịa, và cái bịa đó không thuộc bảng nào.

**Khi DUYỆT art**: che sáu bộ phận → còn đọc ra Axie không? Rồi soi từng bộ phận → có đúng
sáu, mỗi thứ một cái (trừ tai) không? Rồi soi màu → có nằm trong bảng lớp không?

**Khi CẮT art ra sprite**: xem `tools/iso/cat_congtrinh.py` và `tools/iso/don_congtrinh.py` —
Gemini hay vẽ kèm bệ đá, khung viền và cả chữ ghi kích thước. Luôn soi tấm đã cắt trên nền
tương phản trước khi đưa vào game.

**Ràng buộc trùm lên tất cả**: CLAUDE.md Rule 3 — **KHÔNG DÙNG VECTOR. CHẤM HẾT.** Thứ tự ưu
tiên nguồn art: ① gói Spine sẵn có → ② meowa.ai → ③ ảnh chờ `iaChuaArt`.
