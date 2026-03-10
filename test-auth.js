async function test() {
    const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Test',
            email: 'test' + Math.random() + '@test.com',
            username: 'user' + Math.floor(Math.random() * 10000),
            password: 'mypassword123'
        })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
}
test();
