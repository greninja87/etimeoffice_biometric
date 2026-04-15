from setuptools import setup, find_packages

with open("requirements.txt") as f:
    install_requires = f.read().strip().split("\n")

setup(
    name="etimeoffice_biometric",
    version="1.0.0",
    description="Biometric Attendance Integration with eTimeOffice API for ERPNext",
    author="Yash Chaurasia",
    author_email="chaurasiayash351@gmail.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
