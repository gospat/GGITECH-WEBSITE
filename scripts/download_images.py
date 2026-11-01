import os
import urllib.request


def download_unsplash(photo_id: str, out_path: str, width: int, height: int) -> None:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    req = urllib.request.Request(
        f"https://unsplash.com/photos/{photo_id}/download?force=true",
        headers={"User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        base = r.geturl()
    url = f"{base}&w={width}&h={height}&fit=crop"
    urllib.request.urlretrieve(url, out_path)


def main() -> None:
    items = [
        (
            "public/images/illustrations/about-square.jpg",
            "7cVkBtpooDc",
            1200,
            1200,
        ),
        (
            "public/images/illustrations/services-banner.jpg",
            "rzv8T2Yvu6M",
            1920,
            1080,
        ),
        (
            "public/images/projects/telemedicine.jpg",
            "olW8G2XD2H4",
            1920,
            1080,
        ),
        (
            "public/images/projects/university-payment.jpg",
            "dF3aTolQw8U",
            1920,
            1080,
        ),
        (
            "public/images/projects/curriculum.jpg",
            "GjBPLkTDzt4",
            1920,
            1080,
        ),
        (
            "public/images/projects/web3-validator.jpg",
            "v-jFS1AsHXo",
            1920,
            1080,
        ),
        (
            "public/images/blog/nodejs-scaling.jpg",
            "v-jFS1AsHXo",
            1920,
            1080,
        ),
        (
            "public/images/blog/web3-validator.jpg",
            "68BkbUyab2Q",
            1920,
            1080,
        ),
        (
            "public/images/blog/cloud-native.jpg",
            "rzv8T2Yvu6M",
            1920,
            1080,
        ),
        (
            "public/images/blog/security-ai.jpg",
            "7cVkBtpooDc",
            1920,
            1080,
        ),
        (
            "public/images/illustrations/about-hero.jpg",
            "7cVkBtpooDc",
            1920,
            1080,
        ),
        (
            "public/images/illustrations/services-hero.jpg",
            "v-jFS1AsHXo",
            1920,
            1080,
        ),
        (
            "public/images/illustrations/careers-hero.jpg",
            "olW8G2XD2H4",
            1920,
            1080,
        ),
        (
            "public/images/illustrations/technology-lab-hero.jpg",
            "68BkbUyab2Q",
            1920,
            1080,
        ),
        (
            "public/images/illustrations/project-brief-hero.jpg",
            "rzv8T2Yvu6M",
            1920,
            1080,
        ),
    ]

    for out_path, photo_id, width, height in items:
        download_unsplash(photo_id, out_path, width, height)
        print(f"downloaded {out_path}")


if __name__ == "__main__":
    main()
