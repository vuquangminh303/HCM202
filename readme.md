<div align="center">

# 🌟 HÀNH TRÌNH TƯ TƯỞNG HỒ CHÍ MINH - THEO DẤU CHÂN BÁC QUA CÁC THỜI KỲ 🌟

### *Interactive Visualization of Ho Chi Minh Thought Journey Across the Globe*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-^16.8.6-blue.svg)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-Globe-0080ff.svg)](https://threejs.org/)
[![Vietnamese Heritage](https://img.shields.io/badge/Cultural-Heritage-red.svg)](https://en.wikipedia.org/wiki/Ho_Chi_Minh)

</div>

---

## 🎯 GIỚI THIỆU DỰ ÁN

**Hành Trình Tư Tưởng Hồ Chí Minh** là một ứng dụng trực quan hóa tương tác hiện đại, tái hiện hành trình lịch sử vĩ đại của Chủ tịch Hồ Chí Minh qua các quốc gia và thời kỳ khác nhau. Dự án kết hợp công nghệ hiện đại với di sản văn hóa để tạo nên trải nghiệm học tập sống động và ý nghĩa.

<div align="center">

[![Demo](./demo.gif)](./demo.gif)

</div>

---

## ✨ TÍNH NĂNG NỔI BẬT

- 🌍 **Bản đồ 3D tương tác**: Trải nghiệm quả cầu 3D sống động với hiệu ứng ánh sáng và chuyển động mượt mà
- 📚 **Dữ liệu lịch sử phong phú**: Hơn 39 cột mốc quan trọng trong hành trình tìm đường cứu nước (1890-1969)
- 🎨 **Giao diện đa chủ đề**: Chế độ mặc định và chủ đề "Mừng Đảng mừng Xuân" truyền thống
- 🕰️ **Thanh thời gian trực quan**: Dễ dàng điều hướng qua các giai đoạn lịch sử khác nhau
- 📱 **Responsive Design**: Hoạt động tuyệt vời trên mọi thiết bị
- 🎯 **Tập trung vào chi tiết**: Hiển thị thông tin chi tiết, hình ảnh, video và tài liệu tham khảo cho mỗi sự kiện

---

## 🧭 CÁC GIAI ĐOẠN LỊCH SỬ

| Giai đoạn | Thời gian | Nội dung chính |
|-----------|-----------|----------------|
| 🏠 **Tuổi thơ và học tập** | 1890-1911 | Sinh ra tại Kim Liên, Nghệ An → Học tập tại Huế → Dạy học tại Phan Thiết |
| 🌊 **Ra đi tìm đường cứu nước** | 1911-1920 | Hành trình vòng quanh thế giới → Tiếp xúc với các tư tưởng cách mạng |
| 🏛️ **Hình thành tư tưởng cách mạng** | 1920-1930 | Tham gia Đảng Cộng sản Pháp → Thành lập Hội Việt Nam Cách mạng Thanh niên → Thành lập Đảng CSVN |
| 🌪️ **Thử thách và hoạt động bí mật** | 1930-1941 | Bị bắt giam → Hoạt động tại Trung Quốc → Chuẩn bị lực lượng cách mạng |
| 🏆 **Trở về lãnh đạo cách mạng** | 1941-1969 | Trở về Việt Nam → Lãnh đạo Cách mạng Tháng Tám → Khai sinh nước Việt Nam Dân chủ Cộng hòa |

---

## 🚀 CÀI ĐẶT VÀ SỬ DỤNG

### Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) phiên bản 12 trở lên
- [npm](https://www.npmjs.com/) hoặc [yarn](https://yarnpkg.com/)

### Cài đặt
```bash
# Clone repository
git clone YOUR_REPOSITORY_URL

# Di chuyển vào thư mục dự án
cd hcm-thought-globe

# Cài đặt các gói phụ thuộc
npm install

# Khởi chạy ứng dụng
npm start
```

Ứng dụng sẽ chạy tại địa chỉ: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Triển khai với Docker

### Sử dụng Docker Compose
```bash
# Build và chạy với docker-compose
docker-compose up -d
```

### Hoặc build thủ công
```bash
# Build image
docker build -t hcm-thought-globe .

# Chạy container
docker run -d -p 3000:80 hcm-thought-globe
```

Ứng dụng sẽ khả dụng tại: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ CẤU HÌNH VÀ TÙY BIẾN

Bạn có thể tùy chỉnh giao diện quả cầu bằng cách chỉnh sửa file [`src/config.js`](./src/config.js):

```javascript
export default {
  keyword: 'Hành trình Cách mạng của Chủ tịch Hồ Chí Minh',
  globeBackgroundTexture: '...',
  globeCloudsTexture: '...',
  globeTexture: '...',
  options: {
    // Các tùy chọn cấu hình khác
  }
};
```

Cập nhật dữ liệu lịch sử trong file [`src/data/hcm_data.json`](./src/data/hcm_data.json) với cấu trúc:

{
  "id": 1,
  "phase": 1,
  "year": "19-5-1890",
  "location": "Nghệ An, Việt Nam",
  "coordinates": [18.676754, 105.568941],
  "eventName": "Ngày chủ tịch Hồ Chí Minh ra đời",
  "description": "...",
  "mediaUrl": ["..."],
  "templateType": "grid"
}
```

---

## 📊 CẤU TRÚC DỮ LIỆU

Dự án sử dụng cấu trúc JSON tĩnh với các trường:

| Trường | Mô tả |
|--------|-------|
| `phase` | Giai đoạn của hành trình (1-5) |
| `year` | Năm xảy ra sự kiện |
| `location` | Tên địa điểm |
| `coordinates` | Tọa độ địa lý [vĩ độ, kinh độ] |
| `eventName` | Tên của sự kiện lịch sử |
| `description` | Mô tả chi tiết về sự kiện |
| `mediaUrl` | Đường dẫn đến hình ảnh/video |
| `templateType` | Kiểu hiển thị (normal, grid, story_scroll) |

---

## 🎨 CHỦ ĐỀ VÀ GIAO DIỆN

Dự án hỗ trợ hai chế độ giao diện:

- **Chế độ mặc định**: Giao diện hiện đại, tối giản
- **Chế độ "Mừng Đảng mừng Xuân"**: Giao diện truyền thống, mang đậm bản sắc dân tộc

---

## 📈 CÔNG NGHỆ SỬ DỤNG

<div align="center">

| Công nghệ | Mô tả |
|-----------|-------|
| [React](https://reactjs.org/) | Thư viện JavaScript cho giao diện người dùng |
| [Three.js](https://threejs.org/) | Thư viện WebGL cho đồ họa 3D |
| [react-globe](https://github.com/chrisrzhou/react-globe) | Thư viện chuyên dụng cho bản đồ 3D |
| [Sass](https://sass-lang.com/) | Ngôn ngữ stylesheet nâng cao |
| [Docker](https://www.docker.com/) | Container hóa ứng dụng |

</div>

---

## 📁 CẤU TRÚC DỰ ÁN

```
hcm-thought-globe/
├── public/                 # Tài nguyên công cộng
├── src/
│   ├── components/         # Các thành phần React
│   │   ├── app.js          # Thành phần chính
│   │   ├── globe.js        # Thành phần quả cầu 3D
│   │   ├── timeline-bar.js # Thanh thời gian
│   │   ├── details.js      # Chi tiết sự kiện
│   │   └── intro.js        # Giới thiệu
│   ├── data/               # Dữ liệu lịch sử
│   │   └── hcm_data.json   # Dữ liệu chính
│   ├── config.js           # Cấu hình quả cầu
│   ├── state.js            # Quản lý trạng thái
│   └── index.js            # Điểm vào chính
├── docker-compose.yml      # Cấu hình Docker
├── Dockerfile              # Docker image
└── package.json            # Phụ thuộc và script
```

---

## 🤝 ĐÓNG GÓP

Chúng tôi hoan nghênh sự đóng góp từ cộng đồng để làm phong phú thêm dữ liệu lịch sử và cải thiện trải nghiệm người dùng. Xin vui lòng:

1. Fork dự án
2. Tạo branch tính năng (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

---

## 📄 Giấy phép

Dự án này được cấp phép theo giấy phép MIT - xem file [LICENSE](./LICENSE) để biết thêm chi tiết.

---

## 👥 Tác giả

**Nhóm 1 - GD1810-AD (Đại học FPT Hà Nội)**  
© 2026 - Bảo lưu mọi quyền

---

<div align="center">

### 🙏 Tưởng nhớ và tri ân công lao to lớn của Chủ tịch Hồ Chí Minh - Người Cha già của dân tộc Việt Nam

*"Không có gì quý hơn độc lập, tự do"*

</div>