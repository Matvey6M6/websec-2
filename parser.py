import requests
from bs4 import BeautifulSoup
import json
import re
from time import sleep
from pathlib import Path


class BaseParser:
    BASE_URL = "https://ssau.ru"
    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    def get_soup(self, url, retries=3, delay=2):
        for attempt in range(retries):
            try:
                response = requests.get(url, headers=self.HEADERS, timeout=10)
                response.raise_for_status()
                return BeautifulSoup(response.text, "html.parser")
            except requests.RequestException:
                sleep(delay)
        raise ConnectionError(f"Не удалось загрузить страницу: {url}")


class TeacherParser(BaseParser):
    def parse(self):
        teachers = {}
        initial_soup = self.get_soup(f"{self.BASE_URL}/staff")

        max_page = self._get_last_page(initial_soup)

        for page in range(1, max_page + 1):
            soup = self.get_soup(f"{self.BASE_URL}/staff?page={page}&letter=0")
            for link in soup.select("li.list-group-item a[href]"):
                name = ' '.join(link.text.strip().split())
                match = re.search(r'/staff/(\d+)-', link["href"])
                if match:
                    teachers[name] = match.group(1)

        return teachers

    def _get_last_page(self, soup):
        pagination = soup.select_one("ul.pagination")
        if pagination:
            pages = pagination.find_all("li")
            if len(pages) > 2:
                try:
                    return int(pages[-2].text.strip())
                except ValueError:
                    pass
        return 1


class GroupParser(BaseParser):
    def parse(self):
        groups = {}
        soup = self.get_soup(f"{self.BASE_URL}/rasp")
        faculty_ids = {
            match.group(1)
            for link in soup.select('a[href^="/rasp/faculty/"]')
            if (match := re.search(r'/rasp/faculty/(\d+)', link["href"]))
        }

        for fid in faculty_ids:
            for course in range(1, 7):
                try:
                    url = f"{self.BASE_URL}/rasp/faculty/{fid}?course={course}"
                    soup = self.get_soup(url)
                    for link in soup.select('a[href*="groupId="]'):
                        name = link.text.strip()
                        if match := re.search(r'groupId=(\d+)', link["href"]):
                            groups[name] = match.group(1)
                except Exception:
                    continue

        return groups


def save_json(path, data):
    Path(path).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def main():
    try:
        print("Парсинг списка преподавателей...")
        teachers = TeacherParser().parse()
        save_json("teachers.json", teachers)
        print(f"Сохранено преподавателей: {len(teachers)}")

        print("Парсинг списка групп...")
        groups = GroupParser().parse()
        save_json("groups.json", groups)
        print(f"Сохранено групп: {len(groups)}")

    except Exception as err:
        print(f"Произошла ошибка: {err}")


if __name__ == "__main__":
    main()
